package channelconfig

import (
	"fmt"

	"github.com/grafana/grafana/pkg/infra/localcache"
	"github.com/grafana/grafana/pkg/models"
)

var fixtures = []models.LiveChannelConfig{
	{
		OrgId:   1,
		Channel: "?",
		Type:    "?",
		Config:  models.LiveChannelPlain{},
		Secure:  models.LiveChannelSecure{},
	},
}

type Storage struct {
	cache *localcache.CacheService
}

func NewStorage(cache *localcache.CacheService) *Storage {
	s := &Storage{
		cache: cache,
	}
	for _, c := range fixtures {
		_ = s.Save(c)
	}
	return s
}

func getCacheKey(orgID int64, channel string) string {
	return fmt.Sprintf("live_channel_config_%d_%s", orgID, channel)
}

func (s *Storage) Get(orgID int64, channel string) (models.LiveChannelConfig, bool, error) {
	v, ok := s.cache.Get(getCacheKey(orgID, channel))
	if !ok {
		return models.LiveChannelConfig{}, false, nil
	}
	channelConfig, ok := v.(models.LiveChannelConfig)
	if !ok {
		return models.LiveChannelConfig{}, false, fmt.Errorf("unexpected channel config type in cache: %T", v)
	}
	return channelConfig, true, nil
}

func (s *Storage) Save(channelConfig models.LiveChannelConfig) error {
	s.cache.Set(getCacheKey(channelConfig.OrgId, channelConfig.Channel), channelConfig, 0)
	return nil
}
