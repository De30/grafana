package plugins

import (
	"context"

	pluginStoreLib "github.com/grafana/grafana/pkg/plugins/manager/store"
)

var _ StaticRouteResolver = (*RouteResolver)(nil) // gRPC

type RouteResolver struct {
	store *pluginStoreLib.Service
}

func ProvideRouteResolver(store *pluginStoreLib.Service) *RouteResolver {
	return &RouteResolver{store: store}
}

func (r RouteResolver) Routes(ctx context.Context) []*StaticRoute {
	var routes []*StaticRoute
	for _, r := range r.store.Routes() {
		routes = append(routes, &StaticRoute{
			PluginID:  r.PluginID,
			Directory: r.Directory,
		})
	}
	return routes
}
