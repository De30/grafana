package client

import (
	"context"
	"errors"
	"fmt"
	"io"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/genproto/pluginv2"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/auth/jwt"
	"github.com/grafana/grafana/pkg/setting"
)

var ErrNotImplemented = errors.New("ErrMethodNotImplemented")

type RemoteClientService struct {
	cfg *setting.Cfg
	log log.Logger

	qc pluginv2.DataClient
	dc pluginv2.DiagnosticsClient
	sc pluginv2.StreamClient
	rc pluginv2.ResourceClient
}

func newPluginManagerRemoteClient(cfg *setting.Cfg, pluginAuthService jwt.PluginAuthService) (*RemoteClientService, error) {
	s := &RemoteClientService{cfg: cfg, log: log.New("plugin.manager.client")}

	conn, err := grpc.Dial(
		s.cfg.PluginManager.Address,
		grpc.WithTransportCredentials(insecure.NewCredentials()),
		grpc.WithChainUnaryInterceptor(pluginAuthService.UnaryClientInterceptor("plugin-manager")),
		grpc.WithChainStreamInterceptor(pluginAuthService.StreamClientInterceptor("plugin-manager")),
	)
	if err != nil {
		return nil, err
	}

	s.qc = pluginv2.NewDataClient(conn)
	s.dc = pluginv2.NewDiagnosticsClient(conn)
	s.sc = pluginv2.NewStreamClient(conn)
	s.rc = pluginv2.NewResourceClient(conn)

	s.log.Info("Starting Plugin Manager Client")
	return s, nil
}

func (s *RemoteClientService) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	if s.qc == nil {
		return nil, ErrNotImplemented
	}

	protoReq := backend.ToProto().QueryDataRequest(req)
	protoResp, err := s.qc.QueryData(ctx, protoReq)

	if err != nil {
		if status.Code(err) == codes.Unimplemented {
			return nil, ErrNotImplemented
		}

		return nil, fmt.Errorf("%v: %w", "Failed to query data", err)
	}

	return backend.FromProto().QueryDataResponse(protoResp)
}

func (s *RemoteClientService) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if s.rc == nil {
		return ErrNotImplemented
	}

	protoReq := backend.ToProto().CallResourceRequest(req)
	protoStream, err := s.rc.CallResource(ctx, protoReq)
	if err != nil {
		if status.Code(err) == codes.Unimplemented {
			return ErrNotImplemented
		}

		return fmt.Errorf("%v: %w", "Failed to call resource", err)
	}

	for {
		protoResp, err := protoStream.Recv()
		if err != nil {
			if status.Code(err) == codes.Unimplemented {
				return ErrNotImplemented
			}

			if errors.Is(err, io.EOF) {
				return nil
			}

			return fmt.Errorf("%v: %w", "failed to receive call resource response", err)
		}

		if err := sender.Send(backend.FromProto().CallResourceResponse(protoResp)); err != nil {
			return err
		}
	}
}

func (s *RemoteClientService) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	if s.dc == nil {
		return nil, ErrNotImplemented
	}

	protoContext := backend.ToProto().PluginContext(req.PluginContext)
	protoResp, err := s.dc.CheckHealth(ctx, &pluginv2.CheckHealthRequest{PluginContext: protoContext, Headers: req.Headers})

	if err != nil {
		if status.Code(err) == codes.Unimplemented {
			return &backend.CheckHealthResult{
				Status:  backend.HealthStatusUnknown,
				Message: "Health check not implemented",
			}, nil
		}
		return nil, err
	}

	return backend.FromProto().CheckHealthResponse(protoResp), nil
}

func (s *RemoteClientService) CollectMetrics(ctx context.Context, req *backend.CollectMetricsRequest) (*backend.CollectMetricsResult, error) {
	if s.dc == nil {
		return &backend.CollectMetricsResult{}, nil
	}

	protoResp, err := s.dc.CollectMetrics(ctx, backend.ToProto().CollectMetricsRequest(req))
	if err != nil {
		if status.Code(err) == codes.Unimplemented {
			return &backend.CollectMetricsResult{}, nil
		}

		return nil, err
	}

	return backend.FromProto().CollectMetricsResponse(protoResp), nil
}

func (s *RemoteClientService) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	if s.sc == nil {
		return nil, ErrNotImplemented
	}
	protoResp, err := s.sc.SubscribeStream(ctx, backend.ToProto().SubscribeStreamRequest(req))
	if err != nil {
		return nil, err
	}
	return backend.FromProto().SubscribeStreamResponse(protoResp), nil
}

func (s *RemoteClientService) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	if s.sc == nil {
		return nil, ErrNotImplemented
	}
	protoResp, err := s.sc.PublishStream(ctx, backend.ToProto().PublishStreamRequest(req))
	if err != nil {
		return nil, err
	}
	return backend.FromProto().PublishStreamResponse(protoResp), nil
}

func (s *RemoteClientService) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	if s.sc == nil {
		return ErrNotImplemented
	}

	protoReq := backend.ToProto().RunStreamRequest(req)
	protoStream, err := s.sc.RunStream(ctx, protoReq)
	if err != nil {
		if status.Code(err) == codes.Unimplemented {
			return ErrNotImplemented
		}
		return fmt.Errorf("%v: %w", "Failed to call resource", err)
	}

	for {
		p, err := protoStream.Recv()
		if err != nil {
			if status.Code(err) == codes.Unimplemented {
				return ErrNotImplemented
			}
			if errors.Is(err, io.EOF) {
				return nil
			}
			return fmt.Errorf("error running stream: %w", err)
		}
		// From GRPC connection we receive already prepared JSON.
		err = sender.SendJSON(p.Data)
		if err != nil {
			return err
		}
	}
}
