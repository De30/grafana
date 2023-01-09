package store

import (
	"context"
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/backendplugin"
	"github.com/grafana/grafana/pkg/plugins/manager/fakes"
)

func TestStore_Plugin(t *testing.T) {
	t.Run("Plugin returns all non-decommissioned plugins", func(t *testing.T) {
		p1 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-datasource"}}
		p1.RegisterClient(&DecommissionedPlugin{})
		p2 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-panel"}}

		ps := New(newFakePluginRegistry(map[string]*plugins.Plugin{
			p1.ID: &p1,
			p2.ID: &p2,
		}), &fakes.FakeLoader{})

		p, exists := ps.Plugin(context.Background(), p1.ID)
		require.False(t, exists)
		require.Equal(t, plugins.Plugin{}, p)

		p, exists = ps.Plugin(context.Background(), p2.ID)
		require.True(t, exists)
		require.Equal(t, p, p2)
	})
}

func TestStore_Plugins(t *testing.T) {
	t.Run("Plugin returns all non-decommissioned plugins by type", func(t *testing.T) {
		p1 := plugins.Plugin{JSONData: plugins.JSONData{ID: "a-test-datasource", Type: plugins.DataSource}}
		p2 := plugins.Plugin{JSONData: plugins.JSONData{ID: "b-test-panel", Type: plugins.Panel}}
		p3 := plugins.Plugin{JSONData: plugins.JSONData{ID: "c-test-panel", Type: plugins.Panel}}
		p4 := plugins.Plugin{JSONData: plugins.JSONData{ID: "d-test-app", Type: plugins.App}}
		p5 := plugins.Plugin{JSONData: plugins.JSONData{ID: "e-test-panel", Type: plugins.Panel}}
		p5.RegisterClient(&DecommissionedPlugin{})

		ps := New(newFakePluginRegistry(map[string]*plugins.Plugin{
			p1.ID: &p1,
			p2.ID: &p2,
			p3.ID: &p3,
			p4.ID: &p4,
			p5.ID: &p5,
		}), &fakes.FakeLoader{})

		pss := ps.Plugins(context.Background())
		require.Equal(t, pss, []plugins.Plugin{p1, p2, p3, p4})

		pss = ps.Plugins(context.Background(), plugins.App)
		require.Equal(t, pss, []plugins.Plugin{p4})

		pss = ps.Plugins(context.Background(), plugins.Panel)
		require.Equal(t, pss, []plugins.Plugin{p2, p3})

		pss = ps.Plugins(context.Background(), plugins.DataSource)
		require.Equal(t, pss, []plugins.Plugin{p1})

		pss = ps.Plugins(context.Background(), plugins.DataSource, plugins.App, plugins.Panel)
		require.Equal(t, pss, []plugins.Plugin{p1, p2, p3, p4})
	})
}

func TestStore_availablePlugins(t *testing.T) {
	t.Run("Decommissioned plugins are excluded from availablePlugins", func(t *testing.T) {
		p1 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-datasource"}}
		p1.RegisterClient(&DecommissionedPlugin{})
		p2 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-app"}}

		ps := New(newFakePluginRegistry(map[string]*plugins.Plugin{
			p1.ID: &p1,
			p2.ID: &p2,
		}), &fakes.FakeLoader{})

		aps := ps.availablePlugins(context.Background())
		require.Len(t, aps, 1)
		require.Equal(t, p2, aps[0])
	})
}

type DecommissionedPlugin struct {
	backendplugin.Plugin
}

func (p *DecommissionedPlugin) Decommission() error {
	return nil
}

func (p *DecommissionedPlugin) IsDecommissioned() bool {
	return true
}

type fakePluginRegistry struct {
	store map[string]*plugins.Plugin
}

func newFakePluginRegistry(m map[string]*plugins.Plugin) *fakePluginRegistry {
	return &fakePluginRegistry{
		store: m,
	}
}

func (f *fakePluginRegistry) Plugin(_ context.Context, id string) (*plugins.Plugin, bool) {
	p, exists := f.store[id]
	return p, exists
}

func (f *fakePluginRegistry) Plugins(_ context.Context) []*plugins.Plugin {
	var res []*plugins.Plugin
	for _, p := range f.store {
		res = append(res, p)
	}
	return res
}

func (f *fakePluginRegistry) Add(_ context.Context, p *plugins.Plugin) error {
	f.store[p.ID] = p
	return nil
}

func (f *fakePluginRegistry) Remove(_ context.Context, id string) error {
	delete(f.store, id)
	return nil
}
