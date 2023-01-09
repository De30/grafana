package api

import (
	"context"

	pluginLib "github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/plugins"
)

type fakePluginInstaller struct {
	plugins map[string]fakePlugin
}

type fakePlugin struct {
	pluginID string
	version  string
}

func NewFakePluginInstaller() *fakePluginInstaller {
	return &fakePluginInstaller{plugins: map[string]fakePlugin{}}
}

func (pm *fakePluginInstaller) Add(_ context.Context, pluginID, version string, _ plugins.CompatOpts) error {
	pm.plugins[pluginID] = fakePlugin{
		pluginID: pluginID,
		version:  version,
	}
	return nil
}

func (pm *fakePluginInstaller) Remove(_ context.Context, pluginID string) error {
	delete(pm.plugins, pluginID)
	return nil
}

type fakeRendererManager struct {
	plugins.RendererPluginManager
}

func (ps *fakeRendererManager) Renderer(_ context.Context) (pluginLib.Plugin, bool) {
	return pluginLib.Plugin{}, false
}

type fakePluginStaticRouteResolver struct {
	routes []plugins.StaticRoute
}

func (psrr *fakePluginStaticRouteResolver) Routes() []plugins.StaticRoute {
	return psrr.routes
}

type FakePluginStore struct {
	PluginList []plugins.PluginDTO
}

func (pr FakePluginStore) Plugin(_ context.Context, pluginID string) (plugins.PluginDTO, bool) {
	for _, v := range pr.PluginList {
		if v.ID == pluginID {
			return v, true
		}
	}

	return plugins.PluginDTO{}, false
}

func (pr FakePluginStore) Plugins(_ context.Context, pluginTypes ...pluginLib.Type) []plugins.PluginDTO {
	var result []plugins.PluginDTO
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
