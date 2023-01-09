package pluginsintegration

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
	pluginLib "github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/auth/jwt"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/plugins"
	"github.com/grafana/grafana/pkg/setting"
)

type PluginManagerRemoteClient struct {
	PluginManagerClient
	cfg *setting.Cfg
	log log.Logger

	qc pluginv2.DataClient
	dc pluginv2.DiagnosticsClient
	sc pluginv2.StreamClient
	rc pluginv2.ResourceClient
}

func newPluginManagerRemoteClient(cfg *setting.Cfg, pluginAuthService jwt.PluginAuthService) (*PluginManagerRemoteClient, error) {
	s := &PluginManagerRemoteClient{cfg: cfg, log: log.New("plugin.manager.client")}

	s.log.Info("Creating plugin manager client")
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

	s.PluginManagerClient = NewPluginManagerClient(conn)

	return s, nil
}

func (s *PluginManagerRemoteClient) Plugin(ctx context.Context, id string) (plugins.PluginDTO, bool) {
	p, err := s.GetPlugin(ctx, &GetPluginRequest{
		Id: id,
	})
	if err != nil {
		return plugins.PluginDTO{}, false
	}

	return fromProto(p.Plugin), true
}

func (s *PluginManagerRemoteClient) Plugins(ctx context.Context, pluginTypes ...pluginLib.Type) []plugins.PluginDTO {
	var types []string
	for _, t := range pluginTypes {
		types = append(types, string(t))
	}
	resp, err := s.GetPlugins(ctx, &GetPluginsRequest{
		Types: types,
	})
	if err != nil {
		return []plugins.PluginDTO{}
	}

	var res []plugins.PluginDTO
	for _, p := range resp.Plugins {
		res = append(res, fromProto(p))
	}
	return res
}

func (s *PluginManagerRemoteClient) Add(ctx context.Context, pluginID, version string, opts plugins.CompatOpts) error {
	resp, err := s.AddPlugin(ctx, &AddPluginRequest{
		Id:      pluginID,
		Version: version,
		Opts: &AddPluginOpts{
			GrafanaVersion: opts.GrafanaVersion,
			Os:             opts.OS,
			Arch:           opts.Arch,
		},
	})
	if err != nil {
		return err
	}

	if !resp.OK {
		return errors.New("could not add plugin")
	}

	return nil
}

func (s *PluginManagerRemoteClient) Remove(ctx context.Context, pluginID string) error {
	resp, err := s.RemovePlugin(ctx, &RemovePluginRequest{
		Id: pluginID,
	})
	if err != nil {
		return err
	}

	if !resp.OK {
		return errors.New("could not remove plugin")
	}

	return nil
}

var ErrNotImplemented = errors.New("ErrMethodNotImplemented")

func (s *PluginManagerRemoteClient) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
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

func (s *PluginManagerRemoteClient) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
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

func (s *PluginManagerRemoteClient) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
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

func (s *PluginManagerRemoteClient) CollectMetrics(ctx context.Context, req *backend.CollectMetricsRequest) (*backend.CollectMetricsResult, error) {
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

func (s *PluginManagerRemoteClient) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	if s.sc == nil {
		return nil, ErrNotImplemented
	}
	protoResp, err := s.sc.SubscribeStream(ctx, backend.ToProto().SubscribeStreamRequest(req))
	if err != nil {
		return nil, err
	}
	return backend.FromProto().SubscribeStreamResponse(protoResp), nil
}

func (s *PluginManagerRemoteClient) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	if s.sc == nil {
		return nil, ErrNotImplemented
	}
	protoResp, err := s.sc.PublishStream(ctx, backend.ToProto().PublishStreamRequest(req))
	if err != nil {
		return nil, err
	}
	return backend.FromProto().PublishStreamResponse(protoResp), nil
}

func (s *PluginManagerRemoteClient) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
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

func fromProto(p *PluginData) plugins.PluginDTO {
	var links []pluginLib.InfoLink
	for _, l := range p.JsonData.Info.Links {
		links = append(links, pluginLib.InfoLink{
			Name: l.Name,
			URL:  l.Url,
		})
	}

	var screenshots []pluginLib.Screenshots
	for _, s := range p.JsonData.Info.Screenshots {
		screenshots = append(screenshots, pluginLib.Screenshots{
			Name: s.Name,
			Path: s.Path,
		})
	}

	var pluginDeps []pluginLib.Dependency
	for _, pd := range p.JsonData.Dependencies.Plugins {
		pluginDeps = append(pluginDeps, pluginLib.Dependency{
			ID:      pd.Id,
			Type:    pd.Type,
			Name:    pd.Name,
			Version: pd.Version,
		})
	}

	var includes []*pluginLib.Includes
	for _, i := range p.JsonData.Includes {
		includes = append(includes, &pluginLib.Includes{
			Name:       i.Name,
			Path:       i.Path,
			Type:       i.Type,
			Component:  i.Component,
			Role:       org.RoleType(i.Role),
			Action:     i.Action,
			AddToNav:   i.AddToNav,
			DefaultNav: i.DefaultNav,
			Slug:       i.Slug,
			Icon:       i.Icon,
			UID:        i.Uid,
			ID:         i.Id,
		})
	}

	var routes []*pluginLib.Route
	for _, r := range p.JsonData.Routes {
		var urlParams []pluginLib.URLParam
		for _, up := range r.UrlParams {
			urlParams = append(urlParams, pluginLib.URLParam{
				Name:    up.Name,
				Content: up.Content,
			})
		}
		var headers []pluginLib.Header
		for _, h := range r.Headers {
			headers = append(headers, pluginLib.Header{
				Name:    h.Name,
				Content: h.Content,
			})
		}

		rt := &pluginLib.Route{
			Path:      r.Path,
			Method:    r.Method,
			ReqRole:   org.RoleType(r.ReqRole),
			URL:       r.Url,
			URLParams: urlParams,
			Headers:   headers,
			AuthType:  r.AuthType,
			Body:      r.Body,
		}

		if r.TokenAuth != nil {
			rt.TokenAuth = &pluginLib.JWTTokenAuth{
				Url:    r.TokenAuth.Url,
				Scopes: r.TokenAuth.Scopes,
				Params: r.TokenAuth.Params,
			}
		}

		if r.JwtTokenAuth != nil {
			rt.JwtTokenAuth = &pluginLib.JWTTokenAuth{
				Url:    r.JwtTokenAuth.Url,
				Scopes: r.JwtTokenAuth.Scopes,
				Params: r.JwtTokenAuth.Params,
			}
		}

		routes = append(routes, rt)
	}

	var roleRegistration []pluginLib.RoleRegistration
	for _, rr := range p.JsonData.Roles {
		var permissions []pluginLib.Permission
		for _, p := range rr.Role.Permissions {
			permissions = append(permissions, pluginLib.Permission{
				Action: p.Action,
				Scope:  p.Scope,
			})
		}

		roleRegistration = append(roleRegistration, pluginLib.RoleRegistration{
			Role: pluginLib.Role{
				Name:        rr.Role.Name,
				Description: rr.Role.Description,
				Permissions: permissions,
			},
			Grants: rr.Grants,
		})
	}

	dto := plugins.PluginDTO{
		JSONData: pluginLib.JSONData{
			ID:   p.JsonData.Id,
			Type: pluginLib.Type(p.JsonData.Type),
			Name: p.JsonData.Name,
			Info: pluginLib.Info{
				Author: pluginLib.InfoLink{
					Name: p.JsonData.Info.Author.Name,
					URL:  p.JsonData.Info.Author.Url,
				},
				Description: p.JsonData.Info.Description,
				Links:       links,
				Logos: pluginLib.Logos{
					Small: p.JsonData.Info.Logos.Small,
					Large: p.JsonData.Info.Logos.Large,
				},
				Build: pluginLib.BuildInfo{
					Time:   p.JsonData.Info.Build.Time,
					Repo:   p.JsonData.Info.Build.Repo,
					Branch: p.JsonData.Info.Build.Branch,
					Hash:   p.JsonData.Info.Build.Hash,
				},
				Screenshots: screenshots,
				Version:     p.JsonData.Info.Version,
				Updated:     p.JsonData.Info.Updated,
			},
			Dependencies: pluginLib.Dependencies{
				GrafanaDependency: p.JsonData.Dependencies.GrafanaDependency,
				GrafanaVersion:    p.JsonData.Dependencies.GrafanaVersion,
				Plugins:           pluginDeps,
			},
			Includes:      includes,
			State:         pluginLib.ReleaseState(p.JsonData.State),
			Category:      p.JsonData.Category,
			HideFromList:  p.JsonData.HideFromList,
			Preload:       p.JsonData.Preload,
			Backend:       p.JsonData.Backend,
			Routes:        routes,
			Roles:         roleRegistration,
			SkipDataQuery: p.JsonData.SkipDataQuery,
			AutoEnabled:   p.JsonData.AutoEnabled,
			Annotations:   p.JsonData.Annotations,
			Metrics:       p.JsonData.Metrics,
			Alerting:      p.JsonData.Alerting,
			Explore:       p.JsonData.Explore,
			Table:         p.JsonData.Tables,
			Logs:          p.JsonData.Logs,
			Tracing:       p.JsonData.Tracing,
			QueryOptions:  p.JsonData.QueryOptions,
			BuiltIn:       p.JsonData.BuiltIn,
			Mixed:         p.JsonData.Mixed,
			Streaming:     p.JsonData.Streaming,
			SDK:           p.JsonData.Sdk,
			Executable:    p.JsonData.Executable,
		},
		Class:           pluginLib.Class(p.Class),
		IncludedInAppID: p.IncludedInAppID,
		DefaultNavURL:   p.DefaultNavURL,
		Pinned:          p.Pinned,
		Signature:       pluginLib.SignatureStatus(p.Signature),
		SignatureType:   pluginLib.SignatureType(p.SignatureType),
		SignatureOrg:    p.SignatureOrg,
		SignatureError:  nil,
		Module:          p.Module,
		BaseURL:         p.BaseUrl,
		//StreamHandler:   nil,
	}

	return dto
}
