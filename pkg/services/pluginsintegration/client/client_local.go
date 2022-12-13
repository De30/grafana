package client

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/services/plugins"
)

var _ plugins.Client = (*LocalClientService)(nil)

type LocalClientService struct {
	client *plugins.Decorator
}

func newLocalClientService(client *plugins.Decorator) *LocalClientService {
	return &LocalClientService{
		client: client,
	}
}

func (s *LocalClientService) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	return s.client.QueryData(ctx, req)
}

func (s *LocalClientService) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	return s.client.CheckHealth(ctx, req)
}

func (s *LocalClientService) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	return s.client.SubscribeStream(ctx, req)
}

func (s *LocalClientService) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return s.client.PublishStream(ctx, req)
}

func (s *LocalClientService) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	return s.client.RunStream(ctx, req, sender)
}

func (s *LocalClientService) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	return s.client.CallResource(ctx, req, sender)
}

func (s *LocalClientService) CollectMetrics(ctx context.Context, req *backend.CollectMetricsRequest) (*backend.CollectMetricsResult, error) {
	return s.client.CollectMetrics(ctx, req)
}
