package database

import (
	"context"
	"sync"
	"time"

	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/prometheus/client_golang/prometheus"
)

const (
	ExporterName              = "grafana"
	metricsCollectionInterval = time.Minute * 30
)

var (
	// MStatTotalEventActions is a metric gauge for total number of event actions
	MStatTotalEventActions prometheus.Gauge

	// MStatTotalEventActionTokens is a metric gauge for total number of event action tokens
	MStatTotalEventActionTokens prometheus.Gauge

	once        sync.Once
	Initialised bool = false
)

func InitMetrics() {
	once.Do(func() {
		MStatTotalEventActions = prometheus.NewGauge(prometheus.GaugeOpts{
			Name:      "stat_total_event_actions",
			Help:      "total amount of event actions",
			Namespace: ExporterName,
		})

		prometheus.MustRegister(
			MStatTotalEventActions,
		)
	})
}

func (s *EventActionsStoreImpl) RunMetricsCollection(ctx context.Context) error {
	if _, err := s.GetUsageMetrics(ctx); err != nil {
		s.log.Warn("Failed to get usage metrics", "error", err.Error())
	}
	updateStatsTicker := time.NewTicker(metricsCollectionInterval)
	defer updateStatsTicker.Stop()

	for {
		select {
		case <-updateStatsTicker.C:
			if _, err := s.GetUsageMetrics(ctx); err != nil {
				s.log.Warn("Failed to get usage metrics", "error", err.Error())
			}
		case <-ctx.Done():
			return ctx.Err()
		}
	}
}

func (s *EventActionsStoreImpl) GetUsageMetrics(ctx context.Context) (map[string]interface{}, error) {
	stats := map[string]interface{}{}

	sb := &sqlstore.SQLBuilder{}
	dialect := s.sqlStore.Dialect
	sb.Write("SELECT ")
	sb.Write(`(SELECT COUNT(*) FROM ` + dialect.Quote("user") +
		` WHERE is_service_account = ` + dialect.BooleanStr(true) + `) AS eventactions,`)
	sb.Write(`(SELECT COUNT(*) FROM ` + dialect.Quote("api_key") +
		` WHERE service_account_id IS NOT NULL ) AS eventaction_tokens,`)
	// Add count to how many event actions are in teams
	sb.Write(`(SELECT COUNT(*) FROM team_member
	JOIN ` + dialect.Quote("user") + ` on team_member.user_id=` + dialect.Quote("user") + `.id
	WHERE ` + dialect.Quote("user") + `.is_service_account=` + dialect.BooleanStr(true) + ` ) as eventactions_in_teams`)

	type saStats struct {
		EventActions int64 `xorm:"eventactions"`
		Tokens       int64 `xorm:"eventaction_tokens"`
		InTeams      int64 `xorm:"eventactions_in_teams"`
	}

	var sqlStats saStats
	if err := s.sqlStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.SQL(sb.GetSQLString(), sb.GetParams()...).Get(&sqlStats)
		return err
	}); err != nil {
		return nil, err
	}

	stats["stats.eventactions.count"] = sqlStats.EventActions
	stats["stats.eventactions.tokens.count"] = sqlStats.Tokens
	stats["stats.eventactions.in_teams.count"] = sqlStats.InTeams

	MStatTotalEventActionTokens.Set(float64(sqlStats.Tokens))
	MStatTotalEventActions.Set(float64(sqlStats.EventActions))

	return stats, nil
}
