package store

import (
	"context"

	pluginLib "github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/plugins/manager"
	"github.com/grafana/grafana/pkg/plugins/manager/store"
	"github.com/grafana/grafana/pkg/services/plugins"
)

var _ plugins.Store = (*LocalStoreService)(nil)
var _ plugins.Installer = (*LocalStoreService)(nil)

type LocalStoreService struct {
	store     *store.Service
	installer *manager.PluginInstaller
}

func newLocalStoreService(store *store.Service,
	installer *manager.PluginInstaller) *LocalStoreService {
	return &LocalStoreService{
		store:     store,
		installer: installer,
	}
}

func (s *LocalStoreService) Add(ctx context.Context, pluginID, version string, opts plugins.CompatOpts) error {
	return s.installer.Add(ctx, pluginID, version, pluginLib.CompatOpts{
		GrafanaVersion: opts.GrafanaVersion,
		OS:             opts.OS,
		Arch:           opts.OS,
	})
}

func (s *LocalStoreService) Remove(ctx context.Context, pluginID string) error {
	return s.installer.Remove(ctx, pluginID)
}

func (s *LocalStoreService) Plugin(ctx context.Context, pluginID string) (plugins.PluginDTO, bool) {
	p, exists := s.store.Plugin(ctx, pluginID)
	if !exists {
		return plugins.PluginDTO{}, false
	}

	return ToGrafanaDTO(p), true
}

func (s *LocalStoreService) Plugins(ctx context.Context, types ...plugins.Type) []plugins.PluginDTO {
	libTypes := ToLibTypes(types)

	var res []plugins.PluginDTO
	for _, p := range s.store.Plugins(ctx, libTypes...) {
		res = append(res, ToGrafanaDTO(p))
	}

	return res
}

func ToGrafanaDTO(gDTO pluginLib.PluginDTO) plugins.PluginDTO {
	dto := plugins.PluginDTO{
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

func ToLibTypes(types []plugins.Type) []pluginLib.Type {
	var libTypes []pluginLib.Type
	for _, t := range types {
		libTypes = append(libTypes, pluginLib.Type(t))
	}
	return libTypes
}
