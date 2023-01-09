package plugins

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	"github.com/grafana/grafana/pkg/plugins"
)

// Store is the publicly accessible storage for plugins.
type Store interface {
	// Plugin finds a plugin by its ID.
	Plugin(ctx context.Context, pluginID string) (PluginDTO, bool)
	// Plugins returns plugins by their requested type.
	Plugins(ctx context.Context, pluginTypes ...plugins.Type) []PluginDTO
}

type Installer interface {
	// Add adds a new plugin.
	Add(ctx context.Context, pluginID, version string, opts CompatOpts) error
	// Remove removes an existing plugin.
	Remove(ctx context.Context, pluginID string) error
}

type RendererPluginManager interface {
	// Renderer returns a renderer plugin.
	Renderer(ctx context.Context) (plugins.Plugin, bool)
}

type SecretsPluginManager interface {
	// SecretsManager returns a secretsmanager plugin
	SecretsManager(ctx context.Context) (plugins.Plugin, bool)
}

type PluginSource struct {
	Class Class
	Paths []string
}

type CompatOpts struct {
	GrafanaVersion string
	OS             string
	Arch           string
}

// Client is used to communicate with backend plugin implementations.
type Client interface {
	backend.QueryDataHandler
	backend.CheckHealthHandler
	backend.StreamHandler
	backend.CallResourceHandler
	backend.CollectMetricsHandler
}

// ClientMiddleware is an interface representing the ability to create a middleware
// that implements the Client interface.
type ClientMiddleware interface {
	// CreateClientMiddleware creates a new client middleware.
	CreateClientMiddleware(next Client) Client
}

// The ClientMiddlewareFunc type is an adapter to allow the use of ordinary
// functions as ClientMiddleware's. If f is a function with the appropriate
// signature, ClientMiddlewareFunc(f) is a ClientMiddleware that calls f.
type ClientMiddlewareFunc func(next Client) Client

// CreateClientMiddleware implements the ClientMiddleware interface.
func (fn ClientMiddlewareFunc) CreateClientMiddleware(next Client) Client {
	return fn(next)
}

type StaticRouteResolver interface {
	Routes() []StaticRoute
}

type PluginErrorResolver interface {
	PluginErrors() []*Error
}
