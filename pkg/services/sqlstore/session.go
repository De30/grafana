package sqlstore

import (
	"context"
	"errors"
	"fmt"
	"reflect"
	"time"

	"github.com/grafana/grafana/pkg/util/xorm"
	"go.opentelemetry.io/otel/attribute"

	"github.com/mattn/go-sqlite3"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/util/errutil"
	"github.com/grafana/grafana/pkg/util/retryer"
)

var sessionLogger = log.New("sqlstore.session")
var ErrMaximumRetriesReached = errutil.NewBase(errutil.StatusInternal, "sqlstore.max-retries-reached")

type DBSession struct {
	xorm.SessionInterface
	transactionOpen bool
	events          []interface{}
}

type DBTransactionFunc func(sess *DBSession) error

func (sess *DBSession) publishAfterCommit(msg interface{}) {
	sess.events = append(sess.events, msg)
}

func (sess *DBSession) PublishAfterCommit(msg interface{}) {
	sess.events = append(sess.events, msg)
}

func startSessionOrUseExisting(ctx context.Context, engine *xorm.Engine, beginTran bool, tracer tracing.Tracer) (*DBSession, bool, tracing.Span, error) {
	value := ctx.Value(ContextSessionKey{})
	var sess *DBSession
	sess, ok := value.(*DBSession)

	if ok {
		ctxLogger := sessionLogger.FromContext(ctx)
		ctxLogger.Debug("reusing existing session", "transaction", sess.transactionOpen)
		sess.SessionInterface = sess.SessionInterface.Context(ctx)
		return sess, false, nil, nil
	}

	tctx, span := tracer.Start(ctx, "open session")
	span.SetAttributes("transaction", beginTran, attribute.Key("transaction").Bool(beginTran))

	newSess := &DBSession{SessionInterface: engine.NewSession(), transactionOpen: beginTran}

	if beginTran {
		err := newSess.Begin()
		if err != nil {
			return nil, false, span, err
		}
	}
	newSess.SessionInterface = newSess.SessionInterface.Context(tctx)

	return newSess, true, span, nil
}

// WithDbSession calls the callback with the session in the context (if exists).
// Otherwise it creates a new one that is closed upon completion.
// A session is stored in the context if sqlstore.InTransaction() has been been previously called with the same context (and it's not committed/rolledback yet).
// In case of sqlite3.ErrLocked or sqlite3.ErrBusy failure it will be retried at most five times before giving up.
func (ss *SQLStore) WithDbSession(ctx context.Context, callback DBTransactionFunc) error {
	return ss.withDbSession(ctx, ss.engine, callback)
}

// WithNewDbSession calls the callback with a new session that is closed upon completion.
// In case of sqlite3.ErrLocked or sqlite3.ErrBusy failure it will be retried at most five times before giving up.
func (ss *SQLStore) WithNewDbSession(ctx context.Context, callback DBTransactionFunc) error {
	sess := &DBSession{SessionInterface: ss.engine.NewSession(), transactionOpen: false}
	defer sess.Close()
	retry := 0
	return retryer.Retry(ss.retryOnLocks(ctx, callback, sess, retry), ss.dbCfg.QueryRetries, time.Millisecond*time.Duration(10), time.Second)
}

func (ss *SQLStore) retryOnLocks(ctx context.Context, callback DBTransactionFunc, sess *DBSession, retry int) func() (retryer.RetrySignal, error) {
	return func() (retryer.RetrySignal, error) {
		retry++

		err := callback(sess)

		ctxLogger := tsclogger.FromContext(ctx)

		var sqlError sqlite3.Error
		if errors.As(err, &sqlError) && (sqlError.Code == sqlite3.ErrLocked || sqlError.Code == sqlite3.ErrBusy) {
			ctxLogger.Info("Database locked, sleeping then retrying", "error", err, "retry", retry, "code", sqlError.Code)
			// retryer immediately returns the error (if there is one) without checking the response
			// therefore we only have to send it if we have reached the maximum retries
			if retry == ss.dbCfg.QueryRetries {
				return retryer.FuncError, ErrMaximumRetriesReached.Errorf("retry %d: %w", retry, err)
			}
			return retryer.FuncFailure, nil
		}

		if err != nil {
			return retryer.FuncError, err
		}

		return retryer.FuncComplete, nil
	}
}

func (ss *SQLStore) withDbSession(ctx context.Context, engine *xorm.Engine, callback DBTransactionFunc) error {
	sess, isNew, span, err := startSessionOrUseExisting(ctx, engine, false, ss.tracer)
	if err != nil {
		return err
	}
	if isNew {
		defer func() {
			if span != nil {
				span.End()
			}
			sess.Close()
		}()
	}
	retry := 0
	return retryer.Retry(ss.retryOnLocks(ctx, callback, sess, retry), ss.dbCfg.QueryRetries, time.Millisecond*time.Duration(10), time.Second)
}

func (sess *DBSession) InsertId(bean interface{}, dialect migrator.Dialect) (int64, error) {
	table := sess.DB().Mapper.Obj2Table(getTypeName(bean))

	if err := dialect.PreInsertId(table, sess.SessionInterface); err != nil {
		return 0, err
	}
	id, err := sess.SessionInterface.InsertOne(bean)
	if err != nil {
		return 0, err
	}
	if err := dialect.PostInsertId(table, sess.SessionInterface); err != nil {
		return 0, err
	}

	return id, nil
}

func (sess *DBSession) WithReturningID(driverName string, query string, args []interface{}) (int64, error) {
	supported := driverName != migrator.Postgres
	var id int64
	if !supported {
		query = fmt.Sprintf("%s RETURNING id", query)
		if _, err := sess.SQL(query, args...).Get(&id); err != nil {
			return id, err
		}
	} else {
		sqlOrArgs := append([]interface{}{query}, args...)
		res, err := sess.Exec(sqlOrArgs...)
		if err != nil {
			return id, err
		}
		id, err = res.LastInsertId()
		if err != nil {
			return id, err
		}
	}
	return id, nil
}

func getTypeName(bean interface{}) (res string) {
	t := reflect.TypeOf(bean)
	for t.Kind() == reflect.Ptr {
		t = t.Elem()
	}
	return t.Name()
}
