package pluginsintegration

import (
	"github.com/grafana/grafana/pkg/infra/log"
	pluginManagerLib "github.com/grafana/grafana/pkg/plugins/manager"
	"github.com/grafana/grafana/pkg/plugins/manager/store"
	"github.com/grafana/grafana/pkg/services/auth/jwt"
	"github.com/grafana/grafana/pkg/services/plugins"
	"github.com/grafana/grafana/pkg/setting"
)

type PluginManager struct {
	pluginsService

	log log.Logger
}

type pluginsService interface {
	plugins.Store
	plugins.Installer
	plugins.Client
}

func ProvidePluginManager(cfg *setting.Cfg, pluginAuthService jwt.PluginAuthService, _ *store.Service,
	_ *plugins.Decorator, _ *pluginManagerLib.PluginInstaller) (*PluginManager, error) {

	pm := &PluginManager{log: log.New("plugin.manager")}
	svc, err := ProvidePluginManagerRemoteClient(cfg, pluginAuthService)
	if err != nil {
		return nil, err
	}

	pm.pluginsService = svc
	return pm, nil
}
