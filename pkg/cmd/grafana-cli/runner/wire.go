//go:build wireinject
// +build wireinject

package runner

import (
	"github.com/google/wire"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/localcache"
	"github.com/grafana/grafana/pkg/infra/usagestats"
	"github.com/grafana/grafana/pkg/services/secrets"
	secretsDatabase "github.com/grafana/grafana/pkg/services/secrets/database"
	secretsManager "github.com/grafana/grafana/pkg/services/secrets/manager"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/setting"
)

var WireSet = wire.NewSet(
	New,
	localcache.ProvideService,
	bus.ProvideBus,
	wire.Bind(new(bus.Bus), new(*bus.InProcBus)),
	sqlstore.ProvideService,
	wire.InterfaceValue(new(usagestats.Service), NoOpUsageStats{}),
	wire.InterfaceValue(new(routing.RouteRegister), NoOpRouteRegister{}),
	secretsDatabase.ProvideSecretsStore,
	wire.Bind(new(secrets.Store), new(*secretsDatabase.SecretsStoreImpl)),
	secretsManager.ProvideSecretsService,
	wire.Bind(new(secrets.Service), new(*secretsManager.SecretsService)),
)

func Initialize(cfg *setting.Cfg) (Runner, error) {
	wire.Build(WireSet)
	return Runner{}, nil
}
