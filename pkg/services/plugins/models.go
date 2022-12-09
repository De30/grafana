package plugins

import (
	"fmt"

	pluginLib "github.com/grafana/grafana/pkg/plugins"
)

type NotFoundError struct {
	PluginID string
}

func (e NotFoundError) Error() string {
	return fmt.Sprintf("plugin with ID '%s' not found", e.PluginID)
}

type PluginMetaDTO struct {
	pluginLib.JSONData

	Signature pluginLib.SignatureStatus `json:"signature"`

	Module  string `json:"module"`
	BaseURL string `json:"baseUrl"`
}

type DataSourceDTO struct {
	ID         int64                  `json:"id,omitempty"`
	UID        string                 `json:"uid,omitempty"`
	Type       string                 `json:"type"`
	Name       string                 `json:"name"`
	PluginMeta *PluginMetaDTO         `json:"meta"`
	URL        string                 `json:"url,omitempty"`
	IsDefault  bool                   `json:"isDefault"`
	Access     string                 `json:"access,omitempty"`
	Preload    bool                   `json:"preload"`
	Module     string                 `json:"module,omitempty"`
	JSONData   map[string]interface{} `json:"jsonData"`
	ReadOnly   bool                   `json:"readOnly"`

	BasicAuth       string `json:"basicAuth,omitempty"`
	WithCredentials bool   `json:"withCredentials,omitempty"`

	// InfluxDB
	Username string `json:"username,omitempty"`
	Password string `json:"password,omitempty"`

	// InfluxDB + Elasticsearch
	Database string `json:"database,omitempty"`

	// Prometheus
	DirectURL string `json:"directUrl,omitempty"`
}

type PanelDTO struct {
	ID            string         `json:"id"`
	Name          string         `json:"name"`
	Info          pluginLib.Info `json:"info"`
	HideFromList  bool           `json:"hideFromList"`
	Sort          int            `json:"sort"`
	SkipDataQuery bool           `json:"skipDataQuery"`
	ReleaseState  string         `json:"state"`
	BaseURL       string         `json:"baseUrl"`
	Signature     string         `json:"signature"`
	Module        string         `json:"module"`
}

type StaticRoute struct {
	PluginID  string
	Directory string
}

type Error struct {
	pluginLib.ErrorCode `json:"errorCode"`
	PluginID            string `json:"pluginId,omitempty"`
}

type PreloadPlugin struct {
	Path    string `json:"path"`
	Version string `json:"version"`
}
