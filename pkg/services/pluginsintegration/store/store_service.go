package store

import (
	"github.com/grafana/grafana/pkg/infra/log"
	pluginManagerLib "github.com/grafana/grafana/pkg/plugins/manager"
	"github.com/grafana/grafana/pkg/plugins/manager/store"
	"github.com/grafana/grafana/pkg/services/auth/jwt"
	"github.com/grafana/grafana/pkg/services/plugins"
	"github.com/grafana/grafana/pkg/setting"
)

type Service struct {
	pluginStoreService

	log log.Logger
}

type pluginStoreService interface {
	plugins.Store
	plugins.Installer
}

func ProvideStoreService(cfg *setting.Cfg, store *store.Service, installer *pluginManagerLib.PluginInstaller,
	pluginAuthService jwt.PluginAuthService) (*Service, error) {
	ss := &Service{
		log: log.New("plugin.manager"),
	}

	var svc pluginStoreService
	if cfg.ModuleEnabled("all") {
		svc = newLocalStoreService(store, installer)
	} else if !cfg.ModuleEnabled("plugin-manager") {
		var err error
		svc, err = newRemoteStoreClient(cfg, pluginAuthService)
		if err != nil {
			return nil, err
		}
	}

	ss.pluginStoreService = svc
	return ss, nil
}
