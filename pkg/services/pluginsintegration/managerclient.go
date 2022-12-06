package pluginsintegration

import (
	"context"
	"errors"

	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/grafana/grafana/pkg/infra/log"
	pluginLib "github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/auth/jwt"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/plugins"
	"github.com/grafana/grafana/pkg/setting"
)

var _ PluginService = (*PluginManagerClientService)(nil)

type PluginService interface {
	Plugin(ctx context.Context, id string) (plugins.PluginDTO, bool)
	Plugins(ctx context.Context, pluginTypes ...plugins.Type) []plugins.PluginDTO

	Add(ctx context.Context, pluginID, version string, opts plugins.CompatOpts) error
	Remove(ctx context.Context, pluginID string) error

	PluginErrors(context.Context, *GetPluginErrorsRequest) (*GetPluginErrorsResponse, error)
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

type PluginManagerClientService struct {
	PluginManagerClient
	cfg *setting.Cfg
	log log.Logger
}

func (s *PluginManagerClientService) Plugin(ctx context.Context, id string) (plugins.PluginDTO, bool) {
	p, err := s.GetPlugin(ctx, &GetPluginRequest{
		Id: id,
	})
	if err != nil {
		return plugins.PluginDTO{}, false
	}

	return fromProto(p.Plugin), true
}

func (s *PluginManagerClientService) Plugins(ctx context.Context, pluginTypes ...plugins.Type) []plugins.PluginDTO {
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

		routes = append(routes)
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

func (s *PluginManagerClientService) Add(ctx context.Context, pluginID, version string, opts plugins.CompatOpts) error {
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

func (s *PluginManagerClientService) Remove(ctx context.Context, pluginID string) error {
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

func (s *PluginManagerClientService) PluginErrors(ctx context.Context, request *GetPluginErrorsRequest) (*GetPluginErrorsResponse, error) {
	//TODO implement me
	panic("implement PluginErrors()")
}
