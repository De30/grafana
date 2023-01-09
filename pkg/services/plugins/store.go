package plugins

import (
	"context"
	"path/filepath"

	pluginLib "github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/manager/loader"
	"github.com/grafana/grafana/pkg/plugins/manager/registry"
	pluginStoreLib "github.com/grafana/grafana/pkg/plugins/manager/store"
	"github.com/grafana/grafana/pkg/setting"
)

var _ Store = (*StoreService)(nil)

func ProvideStore(cfg *setting.Cfg, pluginRegistry registry.Service, pluginLoader loader.Service) *StoreService {
	return &StoreService{
		cfg:          cfg,
		store:        pluginStoreLib.New(pluginRegistry, pluginLoader),
		pluginLoader: pluginLoader,
	}
}

type StoreService struct {
	store        *pluginStoreLib.Service
	pluginLoader loader.Service
	cfg          *setting.Cfg
}

func (s *StoreService) Plugin(ctx context.Context, pluginID string) (PluginDTO, bool) {
	if p, exists := s.store.Plugin(ctx, pluginID); exists {
		return toGrafanaDTO(p), exists
	}

	return PluginDTO{}, false
}

func (s *StoreService) Plugins(ctx context.Context, pluginTypes ...pluginLib.Type) []PluginDTO {
	plugins := make([]PluginDTO, 0)
	for _, p := range s.store.Plugins(ctx, pluginTypes...) {
		plugins = append(plugins, toGrafanaDTO(p))
	}
	return plugins
}

func (s *StoreService) Run(ctx context.Context) error {
	for _, ps := range pluginSources(s.cfg) {
		if _, err := s.pluginLoader.Load(ctx, ps.Class, ps.Paths); err != nil {
			return err
		}
	}
	return nil
}

func (s *StoreService) IsDisabled() bool {
	return !s.cfg.ModuleEnabled("all")
}

func (s *StoreService) Renderer(ctx context.Context) (pluginLib.Plugin, bool) {
	if p := s.store.Plugins(ctx, pluginLib.Renderer); len(p) == 1 {
		return p[0], true
	}
	return pluginLib.Plugin{}, false
}

func (s *StoreService) SecretsManager(ctx context.Context) (pluginLib.Plugin, bool) {
	if p := s.store.Plugins(ctx, pluginLib.SecretsManager); len(p) == 1 {
		return p[0], true
	}
	return pluginLib.Plugin{}, false
}

func (s *StoreService) Routes() []StaticRoute {
	staticRoutes := make([]StaticRoute, 0)
	for _, p := range s.store.Plugins(context.TODO()) {
		if p.IsCorePlugin() {
			continue
		}
		staticRoutes = append(staticRoutes, StaticRoute{
			PluginID:  p.ID,
			Directory: p.PluginDir,
		})
	}
	return staticRoutes
}

func pluginSources(cfg *setting.Cfg) []pluginLib.PluginSource {
	return []pluginLib.PluginSource{
		{Class: pluginLib.Core, Paths: corePluginPaths(cfg.StaticRootPath)},
		{Class: pluginLib.Bundled, Paths: []string{cfg.BundledPluginsPath}},
		{Class: pluginLib.External, Paths: append([]string{cfg.PluginsPath}, pluginSettingPaths(cfg.PluginSettings)...)},
	}
}

// corePluginPaths provides a list of the Core plugin paths which need to be scanned on init()
func corePluginPaths(staticRootPath string) []string {
	datasourcePaths := filepath.Join(staticRootPath, "app/plugins/datasource")
	panelsPath := filepath.Join(staticRootPath, "app/plugins/panel")
	return []string{datasourcePaths, panelsPath}
}

// pluginSettingPaths provides a plugin paths defined in cfg.PluginSettings which need to be scanned on init()
func pluginSettingPaths(ps map[string]map[string]string) []string {
	var pluginSettingDirs []string
	for _, s := range ps {
		path, exists := s["path"]
		if !exists || path == "" {
			continue
		}
		pluginSettingDirs = append(pluginSettingDirs, path)
	}
	return pluginSettingDirs
}

func toGrafanaDTO(gDTO pluginLib.Plugin) PluginDTO {
	dto := PluginDTO{
		JSONData:        gDTO.JSONData,
		Class:           gDTO.Class,
		IncludedInAppID: gDTO.IncludedInAppID,
		DefaultNavURL:   gDTO.DefaultNavURL,
		Pinned:          gDTO.Pinned,
		Signature:       gDTO.Signature,
		SignatureType:   gDTO.SignatureType,
		SignatureOrg:    gDTO.SignatureOrg,
		SignatureError:  gDTO.SignatureError,
		Module:          gDTO.Module,
		BaseURL:         gDTO.BaseURL,
		//StreamHandler:   nil,
	}

	return dto
}
