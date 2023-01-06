package initializer

import (
	"context"

	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/backendplugin"
)

type Licensing interface {
	Environment() []string

	Edition() string

	Path() string
}

// BackendFactoryProvider provides a backend factory for a provided plugin.
type BackendFactoryProvider interface {
	BackendFactory(ctx context.Context, p *plugins.Plugin) backendplugin.PluginFactoryFunc
}
