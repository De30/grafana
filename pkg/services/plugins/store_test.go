package plugins

import (
	"context"
	"testing"

	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/plugins/fakes"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/stretchr/testify/require"
)

func TestStore_Run(t *testing.T) {
	t.Run("Plugin sources are added in order once Run is executed", func(t *testing.T) {
		var addedPaths []string
		l := &fakes.FakeLoader{
			LoadFunc: func(ctx context.Context, class plugins.Class, paths []string) ([]*plugins.Plugin, error) {
				addedPaths = append(addedPaths, paths...)
				return nil, nil
			},
		}
		cfg := &setting.Cfg{
			PluginsPath: "path2",
			PluginSettings: setting.PluginSettings{
				"blah": map[string]string{
					"path": "path3",
				},
			},
			BundledPluginsPath: "path1",
		}

		svc := ProvideStore(cfg, fakes.NewFakePluginRegistry(), l)
		require.Empty(t, addedPaths)
		err := svc.Run(context.Background())
		require.NoError(t, err)
		require.Equal(t, []string{"app/plugins/datasource", "app/plugins/panel", "path1", "path2", "path3"}, addedPaths)
	})
}

func TestStore_Renderer(t *testing.T) {
	t.Run("Renderer returns a single (non-decommissioned) renderer plugin", func(t *testing.T) {
		p1 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-renderer", Type: plugins.Renderer}}
		p2 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-panel", Type: plugins.Panel}}
		p3 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-app", Type: plugins.App}}

		ps := ProvideStore(setting.NewCfg(), &fakes.FakePluginRegistry{Store: map[string]*plugins.Plugin{
			p1.ID: &p1,
			p2.ID: &p2,
			p3.ID: &p3,
		}}, &fakes.FakeLoader{})

		r, exists := ps.Renderer(context.Background())
		require.True(t, exists)
		require.Equal(t, p1, r)
	})
}

func TestStore_SecretsManager(t *testing.T) {
	t.Run("Renderer returns a single (non-decommissioned) secrets manager plugin", func(t *testing.T) {
		p1 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-renderer", Type: plugins.Renderer}}
		p2 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-panel", Type: plugins.Panel}}
		p3 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-secrets", Type: plugins.SecretsManager}}
		p4 := plugins.Plugin{JSONData: plugins.JSONData{ID: "test-datasource", Type: plugins.DataSource}}

		ps := ProvideStore(setting.NewCfg(), &fakes.FakePluginRegistry{Store: map[string]*plugins.Plugin{
			p1.ID: &p1,
			p2.ID: &p2,
			p3.ID: &p3,
			p4.ID: &p4,
		}}, &fakes.FakeLoader{})

		r, exists := ps.SecretsManager(context.Background())
		require.True(t, exists)
		require.Equal(t, p3, r)
	})
}

func TestStore_Routes(t *testing.T) {
	t.Run("Routes returns all static routes for non-decommissioned plugins", func(t *testing.T) {
		p1 := plugins.Plugin{JSONData: plugins.JSONData{ID: "a-test-renderer", Type: plugins.Renderer}, PluginDir: "/some/dir"}
		p2 := plugins.Plugin{JSONData: plugins.JSONData{ID: "b-test-panel", Type: plugins.Panel}, PluginDir: "/grafana/"}
		p3 := plugins.Plugin{JSONData: plugins.JSONData{ID: "c-test-secrets", Type: plugins.SecretsManager}, PluginDir: "./secrets", Class: plugins.Core}
		p4 := plugins.Plugin{JSONData: plugins.JSONData{ID: "d-test-datasource", Type: plugins.DataSource}, PluginDir: "../test"}
		p5 := plugins.Plugin{JSONData: plugins.JSONData{ID: "e-test-app", Type: plugins.App}}
		p6 := plugins.Plugin{JSONData: plugins.JSONData{ID: "f-test-app", Type: plugins.App}}
		p6.RegisterClient(&fakes.DecommissionedPlugin{})

		ps := ProvideStore(setting.NewCfg(), &fakes.FakePluginRegistry{Store: map[string]*plugins.Plugin{
			p1.ID: &p1,
			p2.ID: &p2,
			p3.ID: &p3,
			p4.ID: &p4,
			p5.ID: &p5,
			p6.ID: &p6,
		}}, &fakes.FakeLoader{})

		sr := func(p plugins.Plugin) StaticRoute {
			return StaticRoute{PluginID: p.ID, Directory: p.PluginDir}
		}

		rs := ps.Routes()
		require.Equal(t, []StaticRoute{sr(p1), sr(p2), sr(p4), sr(p5)}, rs)
	})
}
