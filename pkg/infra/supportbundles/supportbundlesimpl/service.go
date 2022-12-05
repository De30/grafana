package supportbundlesimpl

import (
	"context"
	"time"

	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/kvstore"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/supportbundles"
	"github.com/grafana/grafana/pkg/infra/usagestats"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
)

type Service struct {
	cfg   *setting.Cfg
	store *store

	log log.Logger

	collectors map[string]supportbundles.CollectorFunc
}

func ProvideService(cfg *setting.Cfg, kvStore kvstore.KVStore, routeRegister routing.RouteRegister, settings setting.Provider, usageStats usagestats.Service) *Service {
	s := &Service{
		cfg:        cfg,
		store:      newStore(kvStore),
		log:        log.New("supportbundle.service"),
		collectors: map[string]supportbundles.CollectorFunc{},
	}

	s.registerAPIEndpoints(routeRegister)

	// TODO: move to relevant services
	s.RegisterSupportItemCollector("basic", basicCollector(cfg))
	s.RegisterSupportItemCollector("settings", settingsCollector(settings))
	s.RegisterSupportItemCollector("usage stats", usageStatesCollector(usageStats))

	return s
}

func (s *Service) Create(ctx context.Context, collectors []string, usr *user.SignedInUser) (*supportbundles.Bundle, error) {
	bundle, err := s.store.Create(ctx, usr)
	if err != nil {
		return nil, err
	}

	go func(uid string, collectors []string) {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
		defer cancel()
		s.startBundleWork(ctx, collectors, uid)
	}(bundle.UID, collectors)

	return bundle, nil
}

func (s *Service) Get(ctx context.Context, uid string) (*supportbundles.Bundle, error) {
	return s.store.Get(ctx, uid)
}

func (s *Service) List(ctx context.Context) ([]supportbundles.Bundle, error) {
	return s.store.List()
}

func (s *Service) RegisterSupportItemCollector(name string, fn supportbundles.CollectorFunc) {
	s.collectors[name] = fn
}
