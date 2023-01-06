package signature

import "github.com/grafana/grafana/pkg/plugins"

type PluginLoaderAuthorizer interface {
	// CanLoadPlugin confirms if a plugin is authorized to load
	CanLoadPlugin(plugin *plugins.Plugin) bool
}
