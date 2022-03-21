package snapshottest

import (
	"context"
	"fmt"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/snapshot"
	"sync"
	"time"
)

type Fake struct {
	FakeTime       func() time.Time
	counter        int64
	lock           sync.RWMutex
	store          map[string]*snapshot.DashboardSnapshot
	deleteKeyIndex map[string]string
}

func (f *Fake) Create(_ context.Context, cmd *snapshot.CreateCmd) (*snapshot.CreateResult, error) {
	f.lock.Lock()
	defer f.lock.Unlock()

	now := f.now()

	s, err := cmd.Skel(now)
	if err != nil {
		return nil, err
	}

	f.store[cmd.Key] = &s
	f.deleteKeyIndex[cmd.DeleteKey] = cmd.Key

	return &snapshot.CreateResult{
		Key:       s.Key,
		DeleteKey: s.DeleteKey,
		URL:       s.ExternalURL,
		DeleteURL: s.ExternalDeleteURL,
		ID:        s.ID,
	}, nil
}

func (f *Fake) Delete(_ context.Context, cmd *snapshot.DeleteCmd) error {
	f.lock.Lock()
	defer f.lock.Unlock()

	return f.innerDelete(cmd.DeleteKey)
}

func (f *Fake) GetByKey(_ context.Context, query *snapshot.GetByKeyQuery) (*snapshot.GetResult, error) {
	f.lock.RLock()
	defer f.lock.RUnlock()

	if query.DeleteKey != "" {
		k, exists := f.deleteKeyIndex[query.DeleteKey]
		if !exists {
			return nil, fmt.Errorf("no delete key %s found", k)
		}

		if query.Key != "" && query.Key != k {
			return nil, fmt.Errorf("delete key %s did not match provided snapshot key", k)
		}
		query.Key = k
	}

	s, exists := f.store[query.Key]
	if !exists {
		return nil, fmt.Errorf("no snapshot found with key %s", query.Key)
	}

	return &snapshot.GetResult{Snapshot: *s}, nil
}

func (f *Fake) List(ctx context.Context, query *snapshot.ListQuery) (*snapshot.ListResult, error) {
	f.lock.RLock()
	defer f.lock.RUnlock()

	if query.SignedInUser.IsAnonymous {
		return nil, nil
	}

	var snapshots = make(snapshot.DashboardSnapshotList, 0)

	for _, v := range f.store {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}

		if query.OrgID != v.OrgID {
			continue
		}
		if query.SignedInUser != nil &&
			query.SignedInUser.OrgRole != models.ROLE_ADMIN &&
			query.SignedInUser.UserId != v.UserID {
			continue
		}

		snapshots = append(snapshots, &v.DashboardSnapshotMetadata)

		if query.Limit != 0 && len(snapshots) == query.Limit {
			break
		}
	}

	return &snapshot.ListResult{DashboardSnapshots: snapshots}, nil
}

func (f *Fake) DeleteExpired(ctx context.Context) (*snapshot.DeleteExpiredResult, error) {
	f.lock.Lock()
	defer f.lock.Unlock()

	c := int64(0)
	for _, v := range f.store {
		if ctx.Err() != nil {
			return &snapshot.DeleteExpiredResult{DeletedRows: c}, ctx.Err()
		}

		if v.Expires.IsZero() || f.now().Before(v.Expires) {
			continue
		}

		err := f.innerDelete(v.DeleteKey)
		if err != nil {
			return &snapshot.DeleteExpiredResult{DeletedRows: c}, err
		}

		c++
	}

	return &snapshot.DeleteExpiredResult{DeletedRows: c}, nil
}

func (f *Fake) now() time.Time {
	now := time.Now()
	if f.FakeTime != nil {
		now = f.FakeTime()
	}
	return now
}

func (f *Fake) innerDelete(deleteKey string) error {
	key, exists := f.deleteKeyIndex[deleteKey]
	if !exists {
		return fmt.Errorf("no delete key %s found", key)
	}

	delete(f.store, key)
	delete(f.deleteKeyIndex, deleteKey)
	return nil
}
