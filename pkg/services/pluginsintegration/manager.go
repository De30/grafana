package pluginsintegration

import (
	"context"
	"errors"

	"github.com/grafana/dskit/services"
	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/grpcserver"
)

var _ PluginManagerServer = (*PluginManagerServerService)(nil) // gRPC
var _ PluginService = (*PluginManagerServerService)(nil)

type PluginService interface {
	Plugin(context.Context, *GetPluginRequest) (*GetPluginResponse, error)
	Plugins(context.Context, *GetPluginsRequest) (*GetPluginsResponse, error)

	AddPlugin(context.Context, *AddPluginRequest) (*AddPluginResponse, error)
	RemovePlugin(context.Context, *RemovePluginRequest) (*RemovePluginResponse, error)

	PluginErrors(context.Context, *GetPluginErrorsRequest) (*GetPluginErrorsResponse, error)
}

type PluginManagerServerService struct {
	*services.BasicService
	store     plugins.Store
	client    plugins.Client
	installer plugins.Installer
	log       log.Logger
}

func ProvidePluginManagerServerService(grpcServerProvider grpcserver.Provider, store plugins.Store, client plugins.Client, installer plugins.Installer) *PluginManagerServerService {
	srv := NewPluginManagerServer(store, client, installer)
	srv.BasicService = services.NewBasicService(srv.start, srv.run, srv.stop)
	RegisterPluginManagerServer(grpcServerProvider.GetServer(), srv)
	return srv
}

func NewPluginManagerServer(store plugins.Store, client plugins.Client, installer plugins.Installer) *PluginManagerServerService {
	return &PluginManagerServerService{
		store:     store,
		client:    client,
		installer: installer,
		log:       log.New("plugin.manager.server"),
	}
}

func (s *PluginManagerServerService) start(_ context.Context) error {
	s.log.Info("Starting Plugin Manager Server")
	return nil
}

func (s *PluginManagerServerService) run(ctx context.Context) error {
	<-ctx.Done()
	return nil
}

func (s *PluginManagerServerService) stop(err error) error {
	if err != nil {
		s.log.Error("PluginManager failed", "error", err)
	}
	s.log.Info("Stopping Plugin Manager Server")
	return nil
}

func (s *PluginManagerServerService) Plugin(ctx context.Context, req *GetPluginRequest) (*GetPluginResponse, error) {
	p, exists := s.store.Plugin(ctx, req.Id)
	if !exists {
		return nil, errors.New("plugin not found")
	}

	return &GetPluginResponse{
		Plugin: &PluginData{
			Id:      p.ID,
			Version: p.Info.Version,
		},
	}, nil
}

func (s *PluginManagerServerService) Plugins(ctx context.Context, req *GetPluginsRequest) (*GetPluginsResponse, error) {
	var types []plugins.Type
	for _, t := range req.Types {
		if plugins.Type(t).IsValid() {
			types = append(types, plugins.Type(t))
		}
	}

	var ps []*PluginData
	for _, p := range s.store.Plugins(ctx, types...) {
		ps = append(ps, &PluginData{
			Id:      p.ID,
			Version: p.Info.Version,
		})
	}

	return &GetPluginsResponse{
		Plugins: ps,
	}, nil
}

func (s *PluginManagerServerService) AddPlugin(ctx context.Context, req *AddPluginRequest) (*AddPluginResponse, error) {
	err := s.installer.Add(ctx, req.Id, req.Version, plugins.CompatOpts{
		GrafanaVersion: req.Opts.GrafanaVersion,
		OS:             req.Opts.Os,
		Arch:           req.Opts.Arch,
	})
	if err != nil {
		return &AddPluginResponse{OK: false}, err
	}
	return &AddPluginResponse{OK: true}, nil
}

func (s *PluginManagerServerService) RemovePlugin(ctx context.Context, req *RemovePluginRequest) (*RemovePluginResponse, error) {
	err := s.installer.Remove(ctx, req.Id)
	if err != nil {
		return &RemovePluginResponse{OK: false}, err
	}
	return &RemovePluginResponse{OK: true}, nil
}

func (s *PluginManagerServerService) PluginErrors(ctx context.Context, req *GetPluginErrorsRequest) (*GetPluginErrorsResponse, error) {
	return nil, nil
}

func (s *PluginManagerServerService) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return s.client.QueryData(ctx, req)
}

func (s *PluginManagerServerService) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	return s.client.CallResource(ctx, req, sender)
}

func (s *PluginManagerServerService) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	return s.client.CheckHealth(ctx, req)
}

func (s *PluginManagerServerService) CollectMetrics(ctx context.Context, req *backend.CollectMetricsRequest) (*backend.CollectMetricsResult, error) {
	return s.client.CollectMetrics(ctx, req)
}

func (s *PluginManagerServerService) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	return s.client.SubscribeStream(ctx, req)
}

func (s *PluginManagerServerService) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return s.client.PublishStream(ctx, req)
}

func (s *PluginManagerServerService) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	return s.client.RunStream(ctx, req, sender)
}
