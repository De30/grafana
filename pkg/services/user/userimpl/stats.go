package userimpl

import (
	"context"
	"sync"
	"time"

	"github.com/grafana/grafana/pkg/services/user"
)

type memoizedStats struct {
	sync.Mutex
	stats map[string]interface{}

	expire time.Time
}

const statsMemoizationPeriod = 5 * time.Minute

func (s *Service) Stats(ctx context.Context) map[string]interface{} {
	var memoize bool

	freshMetrics, err := s.store.UserMetrics(ctx)
	if err != nil {
		// FIXME: Log this
	}

	s.memoizedStats.Lock()
	defer s.memoizedStats.Unlock()

	var stats map[string]interface{}
	if time.Now().After(s.memoizedStats.expire) {
		stats = make(map[string]interface{})

		const roleCounterTimeout = 20 * time.Second
		ctx, cancel := context.WithTimeout(ctx, roleCounterTimeout)
		defer cancel()

		roles, err := s.store.CountUserRoles(ctx)
		if err != nil {
			// FIXME: Log this

			return nil
		}

		total := roles[user.StatsKindTotal]
		stats["admins"] = total.Admins
		stats["editors"] = total.Editors
		stats["viewers"] = total.Viewers

		active := roles[user.StatsKindActive]
		stats["active_admins"] = active.Admins
		stats["active_editors"] = active.Editors
		stats["active_viewers"] = active.Viewers

		daily := roles[user.StatsKindDaily]
		stats["daily_active_admins"] = daily.Admins
		stats["daily_active_editors"] = daily.Editors
		stats["daily_active_viewers"] = daily.Viewers

		memoize = true
	} else {
		stats = s.memoizedStats.stats
	}

	for metric, value := range freshMetrics {
		stats[metric] = value
	}

	if memoize {
		s.memoizedStats = memoizedStats{
			stats:  stats,
			expire: time.Now().Add(statsMemoizationPeriod),
		}
	}

	return stats
}
