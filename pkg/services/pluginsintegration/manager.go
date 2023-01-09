package pluginsintegration

import (
	"github.com/grafana/grafana/pkg/infra/log"
	pluginManagerLib "github.com/grafana/grafana/pkg/plugins/manager"
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

func ProvidePluginManager(cfg *setting.Cfg, pluginAuthService jwt.PluginAuthService, store *plugins.StoreService,
	client *plugins.Decorator, installer *pluginManagerLib.PluginInstaller) (*PluginManager, error) {
	pm := &PluginManager{log: log.New("plugin.manager")}

	var svc pluginsService
	if cfg.ModuleEnabled("all") {
		svc = newPluginManagerLocalService(store, client, installer)
	} else if !cfg.ModuleEnabled("plugin-manager") {
		var err error
		svc, err = newPluginManagerRemoteClient(cfg, pluginAuthService)
		if err != nil {
			return nil, err
		}
	}

	pm.pluginsService = svc
	return pm, nil
}
