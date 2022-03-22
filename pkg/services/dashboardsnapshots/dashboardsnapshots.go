package dashboardsnapshots

import (
	"context"
	"github.com/grafana/grafana/pkg/services/snapshot"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/secrets"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

type Service struct {
	Bus             bus.Bus
	SQLStore        sqlstore.Store
	SecretsService  secrets.Service
	SnapshotService snapshot.Service
}

func ProvideService(
	bus bus.Bus,
	store sqlstore.Store,
	secretsService secrets.Service,
	snapshotService snapshot.Service,
) *Service {
	return &Service{
		Bus:             bus,
		SQLStore:        store,
		SecretsService:  secretsService,
		SnapshotService: snapshotService,
	}
}

func (s *Service) CreateDashboardSnapshot(ctx context.Context, cmd *models.CreateDashboardSnapshotCommand) error {
	m, err := cmd.Dashboard.Map()
	if err != nil {
		return err
	}

	res, err := s.SnapshotService.Create(ctx, &snapshot.CreateCmd{
		Dashboard:          m,
		Name:               cmd.Name,
		Expires:            cmd.Expires,
		External:           cmd.External,
		ExternalURL:        cmd.ExternalUrl,
		ExternalDeleteURL:  cmd.ExternalDeleteUrl,
		Key:                cmd.Key,
		DeleteKey:          cmd.DeleteKey,
		OrgID:              cmd.OrgId,
		UserID:             cmd.UserId,
		DashboardEncrypted: cmd.DashboardEncrypted,
	})
	if err != nil {
		return err
	}

	cmd.Result, err = res.Snapshot.ModelsDashboardSnapshot()
	return err
}

func (s *Service) GetDashboardSnapshot(ctx context.Context, query *models.GetDashboardSnapshotQuery) error {
	r, err := s.SnapshotService.GetByKey(ctx, &snapshot.GetByKeyQuery{
		Key:            query.Key,
		DeleteKey:      query.DeleteKey,
		IncludeSecrets: true,
	})
	if err != nil {
		return err
	}

	query.Result, err = r.Snapshot.ModelsDashboardSnapshot()
	return err
}

func (s *Service) DeleteDashboardSnapshot(ctx context.Context, cmd *models.DeleteDashboardSnapshotCommand) error {
	return s.SnapshotService.Delete(ctx, &snapshot.DeleteCmd{DeleteKey: cmd.DeleteKey})
}

func (s *Service) SearchDashboardSnapshots(_ context.Context, query *models.GetDashboardSnapshotsQuery) error {
	return s.SQLStore.SearchDashboardSnapshots(query)
}

func (s *Service) DeleteExpiredSnapshots(ctx context.Context, cmd *models.DeleteExpiredSnapshotsCommand) error {
	return s.SQLStore.DeleteExpiredSnapshots(ctx, cmd)
}
