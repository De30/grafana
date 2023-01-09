package store

import (
	"context"
	"sort"

	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/manager/loader"
	"github.com/grafana/grafana/pkg/plugins/manager/registry"
)

type Service struct {
	pluginRegistry registry.Service
	pluginLoader   loader.Service
}

func New(pluginRegistry registry.Service, pluginLoader loader.Service) *Service {
	return &Service{
		pluginRegistry: pluginRegistry,
		pluginLoader:   pluginLoader,
	}
}

func (s *Service) Plugin(ctx context.Context, pluginID string) (plugins.Plugin, bool) {
	p, exists := s.plugin(ctx, pluginID)
	if !exists {
		return plugins.Plugin{}, false
	}

	return *p, true
}

func (s *Service) Plugins(ctx context.Context, pluginTypes ...plugins.Type) []plugins.Plugin {
	// if no types passed, assume all
	if len(pluginTypes) == 0 {
		pluginTypes = plugins.PluginTypes
	}

	var requestedTypes = make(map[plugins.Type]struct{})
	for _, pt := range pluginTypes {
		requestedTypes[pt] = struct{}{}
	}

	pluginsList := make([]plugins.Plugin, 0)
	for _, p := range s.availablePlugins(ctx) {
		if _, exists := requestedTypes[p.Type]; exists {
			pluginsList = append(pluginsList, p)
		}
	}
	return pluginsList
}

// plugin finds a plugin with `pluginID` from the registry that is not decommissioned
func (s *Service) plugin(ctx context.Context, pluginID string) (*plugins.Plugin, bool) {
	p, exists := s.pluginRegistry.Plugin(ctx, pluginID)
	if !exists {
		return nil, false
	}

	if p.IsDecommissioned() {
		return nil, false
	}

	return p, true
}

// availablePlugins returns all non-decommissioned plugins from the registry sorted by alphabetic order on `plugin.ID`
func (s *Service) availablePlugins(ctx context.Context) []plugins.Plugin {
	var res []plugins.Plugin
	for _, p := range s.pluginRegistry.Plugins(ctx) {
		if !p.IsDecommissioned() {
			res = append(res, *p)
		}
	}
	sort.SliceStable(res, func(i, j int) bool {
		return res[i].ID < res[j].ID
	})
	return res
}
