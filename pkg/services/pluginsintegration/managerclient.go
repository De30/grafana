package pluginsintegration

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/auth/jwt"
	"github.com/grafana/grafana/pkg/setting"
)

var _ PluginManagerClient = (*PluginManagerClientService)(nil)

type PluginManagerClientService struct {
	PluginManagerClient
	cfg *setting.Cfg
	log log.Logger
}

func ProvidePluginManagerClientService(cfg *setting.Cfg, pluginAuthService jwt.PluginAuthService) (*PluginManagerClientService, error) {
	s := &PluginManagerClientService{cfg: cfg, log: log.New("plugin.manager.client")}

	s.log.Info("Dialling plugin manager...", "address", s.cfg.PluginManager.Address)
	conn, err := grpc.Dial(
		s.cfg.PluginManager.Address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithChainUnaryInterceptor(pluginAuthService.UnaryClientInterceptor("plugin-manager")),
		grpc.WithChainStreamInterceptor(pluginAuthService.StreamClientInterceptor("plugin-manager")),
	)
	if err != nil {
		return nil, err
	}
	s.PluginManagerClient = NewPluginManagerClient(conn)
	return s, nil
}
