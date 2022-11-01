package module

import (
	"context"
	"path"
	"path/filepath"

	"github.com/grafana/grafana/pkg/infra/fs"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/plugins"
)

type Loader struct {
	log log.Logger
}

func ProvideService() *Loader {
	return &Loader{
		log: log.New("module.loader"),
	}
}

func (l *Loader) Module(_ context.Context, p plugins.PluginBase) (plugins.ModuleInfo, error) {
	var baseURL string
	if p.IsCorePlugin() {
		baseURL = coreBaseURL(p.Type, p.PluginDir)
	} else {
		baseURL = path.Join("public/plugins", p.ID)
	}

	var module string
	if p.IsCorePlugin() {
		module = coreModule(p.Type, p.PluginDir)
	} else {
		module = path.Join("plugins", p.ID, "module")
	}
	// verify module.js exists for SystemJS to load
	if p.Type != plugins.Renderer && !p.IsCorePlugin() {
		modJS := filepath.Join(p.PluginDir, "module.js")
		if exists, err := fs.Exists(modJS); err != nil {
			return plugins.ModuleInfo{}, err
		} else if !exists {
			l.log.Warn("Plugin missing module.js",
				"pluginID", p.ID,
				"warning", "Missing module.js, If you loaded this plugin from git, make sure to compile it.",
				"path", module)
		}
	}

	return plugins.ModuleInfo{
		Module:  module,
		BaseURL: baseURL,
	}, nil
}

func coreBaseURL(t plugins.Type, pluginDir string) string {
	return path.Join("public/app/plugins", string(t), filepath.Base(pluginDir))
}

func coreModule(t plugins.Type, pluginDir string) string {
	return path.Join("app/plugins", string(t), filepath.Base(pluginDir), "module")
}
