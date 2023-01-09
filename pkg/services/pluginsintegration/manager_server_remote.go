package pluginsintegration

import (
	"context"
	"errors"

	"github.com/grafana/dskit/services"
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/genproto/pluginv2"

	"github.com/grafana/grafana/pkg/infra/log"
	pluginLib "github.com/grafana/grafana/pkg/plugins"
	pluginManagerLib "github.com/grafana/grafana/pkg/plugins/manager"
	"github.com/grafana/grafana/pkg/services/grpcserver"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/plugins"
)

var _ PluginManagerServer = (*PluginManagerRemoteServer)(nil)

type PluginManagerRemoteServer struct {
	*services.BasicService
	store     *plugins.StoreService
	client    *plugins.Decorator
	installer *pluginManagerLib.PluginInstaller
	log       log.Logger
}

func ProvidePluginManagerServer(grpcServerProvider grpcserver.Provider, store *plugins.StoreService,
	client *plugins.Decorator, installer *pluginManagerLib.PluginInstaller) *PluginManagerRemoteServer {
	pm := NewPluginManagerServer(store, client, installer)
	grpcSrv := grpcServerProvider.GetServer()

	RegisterPluginManagerServer(grpcSrv, pm)

	pluginv2.RegisterDataServer(grpcSrv, pm)
	pluginv2.RegisterDiagnosticsServer(grpcSrv, pm)
	pluginv2.RegisterResourceServer(grpcSrv, pm)
	pluginv2.RegisterStreamServer(grpcSrv, pm)

	pm.BasicService = services.NewBasicService(pm.start, pm.run, pm.stop)
	return pm
}

func NewPluginManagerServer(store *plugins.StoreService, client *plugins.Decorator, installer *pluginManagerLib.PluginInstaller,
) *PluginManagerRemoteServer {
	return &PluginManagerRemoteServer{
		store:     store,
		client:    client,
		installer: installer,
		log:       log.New("plugin.manager.server"),
	}
}

func (s *PluginManagerRemoteServer) start(ctx context.Context) error {
	s.log.Info("Starting Plugin Manager Server")
	return s.store.Run(ctx)
}

func (s *PluginManagerRemoteServer) run(ctx context.Context) error {
	<-ctx.Done()
	return nil
}

func (s *PluginManagerRemoteServer) stop(err error) error {
	if err != nil {
		s.log.Error("PluginManager failed", "error", err)
	}
	s.log.Info("Stopping Plugin Manager Server")
	return nil
}

func (s *PluginManagerRemoteServer) Plugin(ctx context.Context, pluginID string) (plugins.PluginDTO, bool) {
	return s.store.Plugin(ctx, pluginID)
}

func (s *PluginManagerRemoteServer) Plugins(ctx context.Context, types ...pluginLib.Type) []plugins.PluginDTO {
	var res []plugins.PluginDTO
	for _, p := range s.store.Plugins(ctx, types...) {
		res = append(res, p)
	}

	return res
}

func (s *PluginManagerRemoteServer) Add(ctx context.Context, pluginID, version string, opts plugins.CompatOpts) error {
	return s.installer.Add(ctx, pluginID, version, pluginLib.CompatOpts{
		GrafanaVersion: opts.GrafanaVersion,
		OS:             opts.OS,
		Arch:           opts.OS,
	})
}

func (s *PluginManagerRemoteServer) Remove(ctx context.Context, pluginID string) error {
	return s.installer.Remove(ctx, pluginID)
}

func (s *PluginManagerRemoteServer) GetPlugin(ctx context.Context, req *GetPluginRequest) (*GetPluginResponse, error) {
	p, exists := s.store.Plugin(ctx, req.Id)
	if !exists {
		return nil, errors.New("plugin not found")
	}

	return &GetPluginResponse{
		Plugin: toProto(p),
	}, nil
}

func (s *PluginManagerRemoteServer) GetPlugins(ctx context.Context, req *GetPluginsRequest) (*GetPluginsResponse, error) {
	var types []pluginLib.Type
	for _, t := range req.Types {
		if pluginLib.Type(t).IsValid() {
			types = append(types, pluginLib.Type(t))
		}
	}

	var ps []*PluginData
	for _, p := range s.store.Plugins(ctx, types...) {
		ps = append(ps, toProto(p))
	}

	return &GetPluginsResponse{
		Plugins: ps,
	}, nil
}

func (s *PluginManagerRemoteServer) AddPlugin(ctx context.Context, req *AddPluginRequest) (*AddPluginResponse, error) {
	err := s.installer.Add(ctx, req.Id, req.Version, pluginLib.CompatOpts{
		GrafanaVersion: req.Opts.GrafanaVersion,
		OS:             req.Opts.Os,
		Arch:           req.Opts.Arch,
	})
	if err != nil {
		return &AddPluginResponse{OK: false}, err
	}
	return &AddPluginResponse{OK: true}, nil
}

func (s *PluginManagerRemoteServer) RemovePlugin(ctx context.Context, req *RemovePluginRequest) (*RemovePluginResponse, error) {
	err := s.installer.Remove(ctx, req.Id)
	if err != nil {
		return &RemovePluginResponse{OK: false}, err
	}
	return &RemovePluginResponse{OK: true}, nil
}

func (s *PluginManagerRemoteServer) QueryData(ctx context.Context, req *pluginv2.QueryDataRequest) (*pluginv2.QueryDataResponse, error) {
	protoResp, err := s.client.QueryData(ctx, backend.FromProto().QueryDataRequest(req))
	if err != nil {
		return nil, err
	}

	return backend.ToProto().QueryDataResponse(protoResp)
}

func (s *PluginManagerRemoteServer) CallResource(req *pluginv2.CallResourceRequest, server pluginv2.Resource_CallResourceServer) error {
	fn := callResourceResponseSenderFunc(func(resp *backend.CallResourceResponse) error {
		return server.Send(backend.ToProto().CallResourceResponse(resp))
	})

	return s.client.CallResource(server.Context(), backend.FromProto().CallResourceRequest(req), fn)
}

func (s *PluginManagerRemoteServer) CheckHealth(ctx context.Context, req *pluginv2.CheckHealthRequest) (*pluginv2.CheckHealthResponse, error) {
	protoResp, err := s.client.CheckHealth(ctx, backend.FromProto().CheckHealthRequest(req))
	if err != nil {
		return nil, err
	}

	return backend.ToProto().CheckHealthResponse(protoResp), nil
}

func (s *PluginManagerRemoteServer) CollectMetrics(ctx context.Context, req *pluginv2.CollectMetricsRequest) (*pluginv2.CollectMetricsResponse, error) {
	protoResp, err := s.client.CollectMetrics(ctx, backend.FromProto().CollectMetricsRequest(req))
	if err != nil {
		return nil, err
	}

	return backend.ToProto().CollectMetricsResult(protoResp), nil
}

func (s *PluginManagerRemoteServer) SubscribeStream(ctx context.Context, req *pluginv2.SubscribeStreamRequest) (*pluginv2.SubscribeStreamResponse, error) {
	protoResp, err := s.client.SubscribeStream(ctx, backend.FromProto().SubscribeStreamRequest(req))
	if err != nil {
		return nil, err
	}

	return backend.ToProto().SubscribeStreamResponse(protoResp), nil
}

func (s *PluginManagerRemoteServer) PublishStream(ctx context.Context, req *pluginv2.PublishStreamRequest) (*pluginv2.PublishStreamResponse, error) {
	protoResp, err := s.client.PublishStream(ctx, backend.FromProto().PublishStreamRequest(req))
	if err != nil {
		return nil, err
	}

	return backend.ToProto().PublishStreamResponse(protoResp), nil
}

func (s *PluginManagerRemoteServer) RunStream(req *pluginv2.RunStreamRequest, server pluginv2.Stream_RunStreamServer) error {
	sender := backend.NewStreamSender(&runStreamServer{server: server})
	return s.client.RunStream(server.Context(), backend.FromProto().RunStreamRequest(req), sender)
}

type runStreamServer struct {
	server pluginv2.Stream_RunStreamServer
}

func (r *runStreamServer) Send(packet *backend.StreamPacket) error {
	return r.server.Send(backend.ToProto().StreamPacket(packet))
}

type callResourceResponseSenderFunc func(resp *backend.CallResourceResponse) error

func (fn callResourceResponseSenderFunc) Send(resp *backend.CallResourceResponse) error {
	return fn(resp)
}

func toProto(p plugins.PluginDTO) *PluginData {
	var links []*PluginData_JsonData_Info_Link
	for _, l := range p.Info.Links {
		links = append(links, &PluginData_JsonData_Info_Link{
			Name: l.Name,
			Url:  l.URL,
		})
	}

	var screenshots []*PluginData_JsonData_Info_Screenshot
	for _, s := range p.Info.Screenshots {
		screenshots = append(screenshots, &PluginData_JsonData_Info_Screenshot{
			Name: s.Name,
			Path: s.Path,
		})
	}

	var pluginDeps []*PluginData_JsonData_Dependencies_PluginDependency
	for _, pd := range p.Dependencies.Plugins {
		pluginDeps = append(pluginDeps, &PluginData_JsonData_Dependencies_PluginDependency{
			Id:      pd.ID,
			Type:    pd.Type,
			Name:    pd.Name,
			Version: pd.Version,
		})
	}

	var includes []*PluginData_JsonData_Includes
	for _, i := range p.Includes {
		includes = append(includes, &PluginData_JsonData_Includes{
			Name:       i.Name,
			Path:       i.Path,
			Type:       i.Type,
			Component:  i.Component,
			Role:       protoRole(i.Role),
			Action:     i.Action,
			AddToNav:   i.AddToNav,
			DefaultNav: i.DefaultNav,
			Slug:       i.Slug,
			Icon:       i.Icon,
			Uid:        i.UID,
			Id:         i.ID,
		})
	}

	var routes []*PluginData_JsonData_Route
	for _, r := range p.Routes {
		var urlParams []*PluginData_JsonData_Route_URLParam
		for _, up := range r.URLParams {
			urlParams = append(urlParams, &PluginData_JsonData_Route_URLParam{
				Name:    up.Name,
				Content: up.Content,
			})
		}
		var headers []*PluginData_JsonData_Route_Header
		for _, h := range r.Headers {
			headers = append(headers, &PluginData_JsonData_Route_Header{
				Name:    h.Name,
				Content: h.Content,
			})
		}

		rt := &PluginData_JsonData_Route{
			Path:      r.Path,
			Method:    r.Method,
			ReqRole:   protoRole(r.ReqRole),
			Url:       r.URL,
			UrlParams: urlParams,
			Headers:   headers,
			AuthType:  r.AuthType,
			Body:      r.Body,
		}

		if r.TokenAuth != nil {
			rt.TokenAuth = &PluginData_JsonData_Route_JWTTokenAuth{
				Url:    r.TokenAuth.Url,
				Scopes: r.TokenAuth.Scopes,
				Params: r.TokenAuth.Params,
			}
		}

		if r.JwtTokenAuth != nil {
			rt.JwtTokenAuth = &PluginData_JsonData_Route_JWTTokenAuth{
				Url:    r.JwtTokenAuth.Url,
				Scopes: r.JwtTokenAuth.Scopes,
				Params: r.JwtTokenAuth.Params,
			}
		}
		routes = append(routes, rt)
	}

	var roleRegistration []*PluginData_JsonData_RoleRegistration
	for _, rr := range p.Roles {
		var permissions []*PluginData_JsonData_RoleRegistration_Permission
		for _, p := range rr.Role.Permissions {
			permissions = append(permissions, &PluginData_JsonData_RoleRegistration_Permission{
				Action: p.Action,
				Scope:  p.Scope,
			})
		}

		roleRegistration = append(roleRegistration, &PluginData_JsonData_RoleRegistration{
			Role: &PluginData_JsonData_RoleRegistration_RBACRole{
				Name:        rr.Role.Name,
				Description: rr.Role.Description,
				Permissions: permissions,
			},
			Grants: rr.Grants,
		})
	}

	dto := &PluginData{
		JsonData: &PluginData_JsonData{
			Id:   p.ID,
			Type: string(p.Type),
			Name: p.Name,
			Info: &PluginData_JsonData_Info{
				Author: &PluginData_JsonData_Info_Author{
					Name: p.Info.Author.Name,
					Url:  p.Info.Author.URL,
				},
				Description: p.Info.Description,
				Links:       links,
				Logos: &PluginData_JsonData_Info_Logos{
					Small: p.Info.Logos.Small,
					Large: p.Info.Logos.Large,
				},
				Build: &PluginData_JsonData_Info_Build{
					Time:   p.Info.Build.Time,
					Repo:   p.Info.Build.Repo,
					Branch: p.Info.Build.Branch,
					Hash:   p.Info.Build.Hash,
				},
				Screenshots: screenshots,
				Version:     p.Info.Version,
				Updated:     p.Info.Updated,
			},
			Dependencies: &PluginData_JsonData_Dependencies{
				GrafanaDependency: p.Dependencies.GrafanaDependency,
				GrafanaVersion:    p.Dependencies.GrafanaVersion,
				Plugins:           pluginDeps,
			},
			Includes:      includes,
			State:         string(p.State),
			Category:      p.Category,
			HideFromList:  p.HideFromList,
			Preload:       p.Preload,
			Backend:       p.Backend,
			Routes:        routes,
			Roles:         roleRegistration,
			SkipDataQuery: p.SkipDataQuery,
			AutoEnabled:   p.AutoEnabled,
			Annotations:   p.Annotations,
			Metrics:       p.Metrics,
			Alerting:      p.Alerting,
			Explore:       p.Explore,
			Tables:        p.Table,
			Logs:          p.Logs,
			Tracing:       p.Tracing,
			QueryOptions:  p.QueryOptions,
			BuiltIn:       p.BuiltIn,
			Mixed:         p.Mixed,
			Streaming:     p.Streaming,
			Sdk:           p.SDK,
			Executable:    p.Executable,
		},
		Class:           string(p.Class),
		IncludedInAppID: p.IncludedInAppID,
		DefaultNavURL:   p.DefaultNavURL,
		Pinned:          p.Pinned,
		Signature:       string(p.Signature),
		SignatureType:   string(p.SignatureType),
		SignatureOrg:    p.SignatureOrg,
		SignatureError:  "",
		Module:          p.Module,
		BaseUrl:         p.BaseURL,
		//StreamHandler:   nil,
	}

	return dto
}

func protoRole(r org.RoleType) PluginData_JsonData_Role {
	switch r {
	case org.RoleAdmin:
		return PluginData_JsonData_ADMIN
	case org.RoleViewer:
		return PluginData_JsonData_VIEWER
	case org.RoleEditor:
		return PluginData_JsonData_EDITOR
	}
	return PluginData_JsonData_VIEWER
}
