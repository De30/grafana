package plugins

import (
	"context"

	"github.com/grafana/grafana/pkg/plugins/backendplugin"
)

// BackendFactoryProvider provides a backend factory for a provided plugin.
type BackendFactoryProvider interface {
	BackendFactory(ctx context.Context, p *Plugin) backendplugin.PluginFactoryFunc
}

type RendererManager interface {
	// Renderer returns a renderer plugin.
	Renderer(ctx context.Context) *Plugin
}

type SecretsPluginManager interface {
	// SecretsManager returns a secretsmanager plugin
	SecretsManager(ctx context.Context) *Plugin
}

type PluginLoaderAuthorizer interface {
	// CanLoadPlugin confirms if a plugin is authorized to load
	CanLoadPlugin(plugin *Plugin) bool
}

type Licensing interface {
	Environment() []string

	Edition() string

	Path() string
}

// RoleRegistry handles the plugin RBAC roles and their assignments
type RoleRegistry interface {
	DeclarePluginRoles(ctx context.Context, ID, name string, registrations []RoleRegistration) error
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
