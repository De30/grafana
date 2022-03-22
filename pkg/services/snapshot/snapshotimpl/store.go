package snapshotimpl

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/grafana/grafana/pkg/services/snapshot"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"time"
)

type Store interface {
	Create(ctx context.Context, snapshot *snapshot.DashboardSnapshot) error
	Read(ctx context.Context, key string) (*snapshot.DashboardSnapshot, error)
	Delete(ctx context.Context, deleteKey string) error

	LookupByDeleteKey(ctx context.Context, deleteKey string) (string, error)
}

type storeSQL struct {
	SQLStore sqlstore.Store // FIXME: Replace with sqlstore.StoreDBSession
}

func (s *storeSQL) Create(ctx context.Context, snap *snapshot.DashboardSnapshot) error {
	marshalledDashboard, err := json.Marshal(snap.Dashboard)
	if err != nil {
		return err
	}

	// TODO: Do we need this workaround?
	if snap.Expires.IsZero() {
		snap.Expires = time.Now().AddDate(50, 0, 0)
	}

	return s.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.Exec(`INSERT INTO dashboard_snapshot
			(name, key, delete_key, org_id, user_id,
			 external, external_url, dashboard, expires, created,
			 updated, external_delete_url, dashboard_encrypted) VALUES
			(?, ?, ?, ?, ?,
			?, ?, ?, ?, ?,
			?, ?, ?)`,
			snap.Name, snap.Key, snap.DeleteKey, snap.OrgID, snap.UserID,
			snap.External, snap.ExternalURL, marshalledDashboard, snap.Expires, snap.Created,
			snap.Updated, snap.ExternalDeleteURL, snap.DashboardEncrypted)
		return err
	})
}

func (s *storeSQL) Read(ctx context.Context, key string) (*snapshot.DashboardSnapshot, error) {
	var snap *snapshot.DashboardSnapshot

	type tmp struct {
		ID          int64 `xorm:"id"`
		Name        string
		Key         string
		OrgID       int64 `xorm:"org_id"`
		UserID      int64 `xorm:"user_id"`
		External    bool
		ExternalURL string `xorm:"external_url"`

		DeleteKey         string `xorm:"delete_key"`
		ExternalDeleteURL string `xorm:"external_delete_url"`

		Expires time.Time
		Created time.Time
		Updated time.Time

		Dashboard          map[string]interface{}
		DashboardEncrypted []byte
	}

	err := s.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		res := &tmp{}

		_, err := sess.Table("dashboard_snapshot").Where("key = ?", key).Get(res)
		if err != nil {
			return err
		}

		snap = &snapshot.DashboardSnapshot{
			DashboardSnapshotMetadata: snapshot.DashboardSnapshotMetadata{
				ID:                res.ID,
				Name:              res.Name,
				Key:               res.Key,
				OrgID:             res.OrgID,
				UserID:            res.UserID,
				External:          res.External,
				ExternalURL:       res.ExternalURL,
				DeleteKey:         res.DeleteKey,
				ExternalDeleteURL: res.ExternalDeleteURL,
				Expires:           res.Expires,
				Created:           res.Created,
				Updated:           res.Updated,
			},
			Dashboard:          res.Dashboard,
			DashboardEncrypted: res.DashboardEncrypted,
		}
		return nil
	})
	if err != nil {
		return nil, err
	}

	return snap, nil
}

func (s *storeSQL) Delete(ctx context.Context, deleteKey string) error {
	return s.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.Exec(
			"DELETE FROM dashboard_snapshot WHERE delete_key = ?",
			deleteKey,
		)
		return err
	})
}

func (s *storeSQL) LookupByDeleteKey(ctx context.Context, deleteKey string) (string, error) {
	var key string

	err := s.SQLStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		res, err := sess.QueryString(
			"SELECT key FROM dashboard_snapshot WHERE delete_key = ? LIMIT 1",
			deleteKey,
		)
		if err != nil {
			return err
		}

		if len(res) < 1 {
			return fmt.Errorf("snapshot not found")
		}

		key = res[0]["key"]
		return nil
	})

	return key, err
}
