package plugins

import (
	"context"

	pluginLib "github.com/grafana/grafana/pkg/plugins"
)

type FakePluginStore struct {
	PluginList []PluginDTO
}

func (pr FakePluginStore) Plugin(_ context.Context, pluginID string) (PluginDTO, bool) {
	for _, v := range pr.PluginList {
		if v.ID == pluginID {
			return v, true
		}
	}

	return PluginDTO{}, false
}

func (pr FakePluginStore) Plugins(_ context.Context, pluginTypes ...pluginLib.Type) []PluginDTO {
	var result []PluginDTO
	if len(pluginTypes) == 0 {
		pluginTypes = pluginLib.PluginTypes
	}

	for _, v := range pr.PluginList {
		for _, t := range pluginTypes {
			if v.Type == t {
				result = append(result, v)
			}
		}
	}

	return result
}
