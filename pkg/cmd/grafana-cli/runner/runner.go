package runner

import (
	"context"

	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/usagestats"
	"github.com/grafana/grafana/pkg/services/encryption"
	"github.com/grafana/grafana/pkg/services/secrets/manager"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

type Runner struct {
	Cfg               *setting.Cfg
	SQLStore          *sqlstore.SQLStore
	SettingsProvider  setting.Provider
	EncryptionService encryption.Internal
	SecretsService    *manager.SecretsService
}

func New(cfg *setting.Cfg, sqlStore *sqlstore.SQLStore, settingsProvider setting.Provider,
	encryptionService encryption.Internal, secretsService *manager.SecretsService) Runner {
	return Runner{
		Cfg:               cfg,
		SQLStore:          sqlStore,
		SettingsProvider:  settingsProvider,
		EncryptionService: encryptionService,
		SecretsService:    secretsService,
	}
}

// NoOp implementations of those dependencies that makes no sense to
// inject on CLI command executions (like the route registerer, for instance).

type NoOpUsageStats struct{}

func (NoOpUsageStats) GetUsageReport(context.Context) (usagestats.Report, error) {
	return usagestats.Report{}, nil
}

func (NoOpUsageStats) RegisterMetricsFunc(_ usagestats.MetricsFunc) {}

func (NoOpUsageStats) RegisterSendReportCallback(_ usagestats.SendReportCallbackFunc) {}

func (NoOpUsageStats) ShouldBeReported(context.Context, string) bool { return false }

type NoOpRouteRegister struct{}

func (NoOpRouteRegister) Get(string, ...web.Handler) {}

func (NoOpRouteRegister) Post(string, ...web.Handler) {}

func (NoOpRouteRegister) Delete(string, ...web.Handler) {}

func (NoOpRouteRegister) Put(string, ...web.Handler) {}

func (NoOpRouteRegister) Patch(string, ...web.Handler) {}

func (NoOpRouteRegister) Any(string, ...web.Handler) {}

func (NoOpRouteRegister) Group(string, func(routing.RouteRegister), ...web.Handler) {}

func (NoOpRouteRegister) Insert(string, func(routing.RouteRegister), ...web.Handler) {}

func (NoOpRouteRegister) Register(routing.Router) {}

func (NoOpRouteRegister) Reset() {}
