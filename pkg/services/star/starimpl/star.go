package starimpl

import (
	"context"

	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/services/star"
	"github.com/grafana/grafana/pkg/setting"
)

type Service struct {
	store            store
	dashboardService dashboards.DashboardService
	routeRegister    routing.RouteRegister
}

func ProvideService(db db.DB, cfg *setting.Cfg, dashboardService dashboards.DashboardService, routeRegister routing.RouteRegister) star.Service {
	var s store = &sqlStore{
		db: db,
	}
	if cfg.IsFeatureToggleEnabled("newDBLibrary") {
		s = &sqlxStore{
			sess: db.GetSqlxSession(),
		}
	}
	srv := &Service{
		store:            s,
		dashboardService: dashboardService,
		routeRegister:    routeRegister,
	}
	srv.registerAPIEndpoints()
	return srv
}

func (s *Service) Add(ctx context.Context, cmd *star.StarDashboardCommand) error {
	if err := cmd.Validate(); err != nil {
		return err
	}
	return s.store.Insert(ctx, cmd)
}

func (s *Service) Delete(ctx context.Context, cmd *star.UnstarDashboardCommand) error {
	if err := cmd.Validate(); err != nil {
		return err
	}
	return s.store.Delete(ctx, cmd)
}

func (s *Service) IsStarredByUser(ctx context.Context, query *star.IsStarredByUserQuery) (bool, error) {
	return s.store.Get(ctx, query)
}

func (s *Service) GetByUser(ctx context.Context, cmd *star.GetUserStarsQuery) (*star.GetUserStarsResult, error) {
	return s.store.List(ctx, cmd)
}

func (s *Service) DeleteByUser(ctx context.Context, userID int64) error {
	return s.store.DeleteByUser(ctx, userID)
}
