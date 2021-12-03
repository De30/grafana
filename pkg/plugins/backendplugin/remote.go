package backendplugin

import (
	"context"
	"errors"
	"io"
	"sync"

	"google.golang.org/grpc"

	"github.com/gogo/status"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/genproto/pluginv2"
	"github.com/grafana/grafana/pkg/infra/log"
	"google.golang.org/grpc/codes"
)

type RemotePlugin struct {
	mu                sync.Mutex
	exited            bool
	pluginId          string
	addr              string
	logger            log.Logger
	dataClient        pluginv2.DataClient
	diagnosticsClient pluginv2.DiagnosticsClient
	resourceClient    pluginv2.ResourceClient
	shutdown          ShutdownFunc
}

// ShutdownFunc is meant to be called to clean up resources created and in use when a plugin is started
type ShutdownFunc func()

func NewRemotePlugin(pluginId, addr string, l log.Logger) (*RemotePlugin, error) {
	plugin := &RemotePlugin{
		addr:     addr,
		pluginId: pluginId,
		logger:   l,
	}

	return plugin, nil
}

// CheckHealth makes a CheckHealth request to the connected plugin
func (p *RemotePlugin) CheckHealth(ctx context.Context, r *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	req := &pluginv2.CheckHealthRequest{
		PluginContext: backend.ToProto().PluginContext(r.PluginContext),
	}

	resp, err := p.diagnosticsClient.CheckHealth(ctx, req)
	if err != nil {
		return nil, err
	}

	return backend.FromProto().CheckHealthResponse(resp), nil
}

// CallResource makes a CallResource request to the connected plugin
func (p *RemotePlugin) CallResource(ctx context.Context, r *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	protoReq := backend.ToProto().CallResourceRequest(r)
	protoStream, err := p.resourceClient.CallResource(ctx, protoReq)
	if err != nil {
		if status.Code(err) == codes.Unimplemented {
			return errors.New("method not implemented")
		}

		return err
	}

	for {
		protoResp, err := protoStream.Recv()
		if err != nil {
			if status.Code(err) == codes.Unimplemented {
				return errors.New("method not implemented")
			}

			if errors.Is(err, io.EOF) {
				return nil
			}

			return err
		}

		if err := sender.Send(backend.FromProto().CallResourceResponse(protoResp)); err != nil {
			return err
		}
	}
}

// QueryData makes a QueryData request to the connected plugin
func (p *RemotePlugin) QueryData(ctx context.Context, r *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	req := backend.ToProto().QueryDataRequest(r)

	resp, err := p.dataClient.QueryData(ctx, req)
	if err != nil {
		return nil, err
	}

	return backend.FromProto().QueryDataResponse(resp)
}

func (p *RemotePlugin) Start(ctx context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	p.logger.Error("Starting plugin")
	conn, err := grpc.DialContext(ctx, p.addr, grpc.WithInsecure(), grpc.WithBlock())
	if err != nil {
		p.logger.Error(err.Error())
		return err
	}
	p.logger.Error("plugin started")

	p.shutdown = func() { conn.Close() }
	p.diagnosticsClient = pluginv2.NewDiagnosticsClient(conn)
	p.dataClient = pluginv2.NewDataClient(conn)
	p.resourceClient = pluginv2.NewResourceClient(conn)
	p.exited = false

	return nil
}

func (p *RemotePlugin) Stop(ctx context.Context) error {
	p.mu.Lock()
	defer p.mu.Unlock()

	if p.shutdown != nil {
		p.shutdown()
		p.exited = true
	}
	return nil
}

func (p *RemotePlugin) CollectMetrics(ctx context.Context) (*backend.CollectMetricsResult, error) {
	return nil, ErrMethodNotImplemented
}

func (p *RemotePlugin) SubscribeStream(ctx context.Context, request *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	return nil, ErrMethodNotImplemented
}

func (p *RemotePlugin) PublishStream(ctx context.Context, request *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return nil, ErrMethodNotImplemented
}

func (p *RemotePlugin) RunStream(ctx context.Context, request *backend.RunStreamRequest, sender *backend.StreamSender) error {
	return ErrMethodNotImplemented
}

func (p *RemotePlugin) PluginID() string {
	return p.pluginId
}

func (p *RemotePlugin) Logger() log.Logger {
	return p.logger
}

func (p *RemotePlugin) Exited() bool {
	p.mu.Lock()
	defer p.mu.Unlock()
	return p.exited
}

func (p *RemotePlugin) IsManaged() bool {
	return true
}

func (p *RemotePlugin) Decommission() error {
	return nil
}

func (p *RemotePlugin) IsDecommissioned() bool {
	return false
}
