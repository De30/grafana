package client

import (
	"github.com/grafana/grafana/pkg/infra/log"
	pluginManagerLib "github.com/grafana/grafana/pkg/plugins/manager"
	"github.com/grafana/grafana/pkg/plugins/manager/store"
	"github.com/grafana/grafana/pkg/services/auth/jwt"
	"github.com/grafana/grafana/pkg/services/plugins"
	"github.com/grafana/grafana/pkg/setting"
)

type Service struct {
	pluginsService

	log log.Logger
}

type pluginsService interface {
	plugins.Client
}

func ProvideClientService(cfg *setting.Cfg, pluginAuthService jwt.PluginAuthService, store *store.Service,
	client *plugins.Decorator, installer *pluginManagerLib.PluginInstaller) (*Service, error) {
	pm := &Service{log: log.New("plugin.manager")}

	var svc pluginsService
	if cfg.ModuleEnabled("all") {
		svc = newLocalClientService(client)
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
