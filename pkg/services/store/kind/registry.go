package kind

import (
	"fmt"
	"sort"
	"sync"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/rendering"
	"github.com/grafana/grafana/pkg/services/store/kind/dashboard"
	"github.com/grafana/grafana/pkg/services/store/kind/dataframe"
	"github.com/grafana/grafana/pkg/services/store/kind/folder"
	"github.com/grafana/grafana/pkg/services/store/kind/geojson"
	"github.com/grafana/grafana/pkg/services/store/kind/jsonobj"
	"github.com/grafana/grafana/pkg/services/store/kind/playlist"
	"github.com/grafana/grafana/pkg/services/store/kind/png"
	"github.com/grafana/grafana/pkg/services/store/kind/preferences"
	"github.com/grafana/grafana/pkg/services/store/kind/snapshot"
	"github.com/grafana/grafana/pkg/services/store/kind/svg"
	"github.com/grafana/grafana/pkg/setting"
)

type KindRegistry interface {
	Register(info models.EntityKindInfo, builder models.EntitySummaryBuilder) error
	GetSummaryBuilder(kind string) models.EntitySummaryBuilder
	GetInfo(kind string) (models.EntityKindInfo, error)
	GetFromExtension(suffix string) (models.EntityKindInfo, error)
	GetKinds() []models.EntityKindInfo
}

func NewKindRegistry() KindRegistry {
	kinds := make(map[string]*kindValues)
	kinds[models.StandardKindPlaylist] = &kindValues{
		info:    playlist.GetEntityKindInfo(),
		builder: playlist.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindDashboard] = &kindValues{
		info:    dashboard.GetEntityKindInfo(),
		builder: dashboard.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindSnapshot] = &kindValues{
		info:    snapshot.GetEntityKindInfo(),
		builder: snapshot.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindFolder] = &kindValues{
		info:    folder.GetEntityKindInfo(),
		builder: folder.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindPNG] = &kindValues{
		info:    png.GetEntityKindInfo(),
		builder: png.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindGeoJSON] = &kindValues{
		info:    geojson.GetEntityKindInfo(),
		builder: geojson.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindDataFrame] = &kindValues{
		info:    dataframe.GetEntityKindInfo(),
		builder: dataframe.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindJSONObj] = &kindValues{
		info:    jsonobj.GetEntityKindInfo(),
		builder: jsonobj.GetEntitySummaryBuilder(),
	}
	kinds[models.StandardKindPreferences] = &kindValues{
		info:    preferences.GetEntityKindInfo(),
		builder: preferences.GetEntitySummaryBuilder(),
	}

	// create a registry
	reg := &registry{
		mutex: sync.RWMutex{},
		kinds: kinds,
	}
	reg.updateInfoArray()
	return reg
}

// TODO? This could be a zero dependency service that others are responsible for configuring
func ProvideService(cfg *setting.Cfg, renderer rendering.Service) KindRegistry {
	reg := NewKindRegistry()

	// Register SVG support
	//-----------------------
	info := svg.GetEntityKindInfo()
	allowUnsanitizedSvgUpload := cfg != nil && cfg.Storage.AllowUnsanitizedSvgUpload
	support := svg.GetEntitySummaryBuilder(allowUnsanitizedSvgUpload, renderer)
	_ = reg.Register(info, support)

	return reg
}

type kindValues struct {
	info    models.EntityKindInfo
	builder models.EntitySummaryBuilder
}

type registry struct {
	mutex  sync.RWMutex
	kinds  map[string]*kindValues
	info   []models.EntityKindInfo
	suffix map[string]models.EntityKindInfo
}

func (r *registry) updateInfoArray() {
	suffix := make(map[string]models.EntityKindInfo)
	info := make([]models.EntityKindInfo, 0, len(r.kinds))
	for _, v := range r.kinds {
		info = append(info, v.info)
		if v.info.FileExtension != "" {
			suffix[v.info.FileExtension] = v.info
		}
	}
	sort.Slice(info, func(i, j int) bool {
		return info[i].ID < info[j].ID
	})
	r.info = info
	r.suffix = suffix
}

func (r *registry) Register(info models.EntityKindInfo, builder models.EntitySummaryBuilder) error {
	if info.ID == "" || builder == nil {
		return fmt.Errorf("invalid kind")
	}

	r.mutex.Lock()
	defer r.mutex.Unlock()

	if r.kinds[info.ID] != nil {
		return fmt.Errorf("already exits")
	}

	r.kinds[info.ID] = &kindValues{
		info:    info,
		builder: builder,
	}
	r.updateInfoArray()
	return nil
}

// GetSummaryBuilder returns a builder or nil if not found
func (r *registry) GetSummaryBuilder(kind string) models.EntitySummaryBuilder {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	v, ok := r.kinds[kind]
	if ok {
		return v.builder
	}
	return nil
}

// GetInfo returns the registered info
func (r *registry) GetInfo(kind string) (models.EntityKindInfo, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	v, ok := r.kinds[kind]
	if ok {
		return v.info, nil
	}
	return models.EntityKindInfo{}, fmt.Errorf("not found")
}

// GetInfo returns the registered info
func (r *registry) GetFromExtension(suffix string) (models.EntityKindInfo, error) {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	v, ok := r.suffix[suffix]
	if ok {
		return v, nil
	}
	return models.EntityKindInfo{}, fmt.Errorf("not found")
}

// GetSummaryBuilder returns a builder or nil if not found
func (r *registry) GetKinds() []models.EntityKindInfo {
	r.mutex.RLock()
	defer r.mutex.RUnlock()

	return r.info // returns a copy of the array
}
