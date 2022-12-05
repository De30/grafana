package supportbundlesimpl

import (
	"context"
	"time"

	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/kvstore"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/supportbundles"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/setting"
)

type Service struct {
	cfg   *setting.Cfg
	store *store

	log log.Logger

	collectors []supportbundles.CollectorFunc
}

func ProvideService(cfg *setting.Cfg, kvStore kvstore.KVStore, routeRegister routing.RouteRegister, tracer tracing.Tracer) *Service {
	s := &Service{
		cfg:   cfg,
		store: newStore(kvStore),
		log:   log.New("supportbundle.service"),
	}

	s.registerAPIEndpoints(routeRegister)
	return s
}

func (s *Service) Create(ctx context.Context) (*supportbundles.Bundle, error) {
	bundle, err := s.store.Create(ctx)
	if err != nil {
		return nil, err
	}

	go func(uid string) {
		ctx, cancel := context.WithTimeout(context.Background(), 20*time.Minute)
		defer cancel()
		s.startBundleWork(ctx, uid)
	}(bundle.UID)

	return bundle, nil
}

func (s *Service) List(ctx context.Context) ([]supportbundles.Bundle, error) {
	return s.store.List()
}

func (s *Service) RegisterSupportItemCollector(fn supportbundles.CollectorFunc) {
	s.collectors = append(s.collectors, fn)
}
