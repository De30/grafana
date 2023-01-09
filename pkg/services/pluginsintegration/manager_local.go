package pluginsintegration

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	pluginLib "github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/manager"
	"github.com/grafana/grafana/pkg/services/plugins"
)

var _ plugins.Store = (*PluginManagerLocalService)(nil)
var _ plugins.Client = (*PluginManagerLocalService)(nil)
var _ plugins.Installer = (*PluginManagerLocalService)(nil)

type PluginManagerLocalService struct {
	store     *plugins.StoreService
	client    *plugins.Decorator
	installer *manager.PluginInstaller
}

func newPluginManagerLocalService(store *plugins.StoreService, client *plugins.Decorator,
	installer *manager.PluginInstaller) *PluginManagerLocalService {
	return &PluginManagerLocalService{
		store:     store,
		client:    client,
		installer: installer,
	}
}

func (s *PluginManagerLocalService) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return s.client.QueryData(ctx, req)
}

func (s *PluginManagerLocalService) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	return s.client.CheckHealth(ctx, req)
}

func (s *PluginManagerLocalService) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	return s.client.SubscribeStream(ctx, req)
}

func (s *PluginManagerLocalService) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return s.client.PublishStream(ctx, req)
}

func (s *PluginManagerLocalService) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	return s.client.RunStream(ctx, req, sender)
}

func (s *PluginManagerLocalService) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	return s.client.CallResource(ctx, req, sender)
}

func (s *PluginManagerLocalService) CollectMetrics(ctx context.Context, req *backend.CollectMetricsRequest) (*backend.CollectMetricsResult, error) {
	return s.client.CollectMetrics(ctx, req)
}

func (s *PluginManagerLocalService) Add(ctx context.Context, pluginID, version string, opts plugins.CompatOpts) error {
	return s.installer.Add(ctx, pluginID, version, pluginLib.CompatOpts{
		GrafanaVersion: opts.GrafanaVersion,
		OS:             opts.OS,
		Arch:           opts.OS,
	})
}

func (s *PluginManagerLocalService) Remove(ctx context.Context, pluginID string) error {
	return s.installer.Remove(ctx, pluginID)
}

func (s *PluginManagerLocalService) Plugin(ctx context.Context, pluginID string) (plugins.PluginDTO, bool) {
	return s.store.Plugin(ctx, pluginID)
}

func (s *PluginManagerLocalService) Plugins(ctx context.Context, types ...pluginLib.Type) []plugins.PluginDTO {
	var res []plugins.PluginDTO
	for _, p := range s.store.Plugins(ctx, types...) {
		res = append(res, p)
	}

	return res
}
