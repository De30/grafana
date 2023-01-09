package plugins

import (
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/grafana/grafana-plugin-sdk-go/backend"

	pluginLib "github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/util"
)

var ErrFileNotExist = fmt.Errorf("file does not exist")

type PluginDTO struct {
	pluginLib.JSONData

	pluginDir string

	Class pluginLib.Class

	// App fields
	IncludedInAppID string
	DefaultNavURL   string
	Pinned          bool

	// Signature fields
	Signature      pluginLib.SignatureStatus
	SignatureType  pluginLib.SignatureType
	SignatureOrg   string
	SignatureError *pluginLib.SignatureError

	// SystemJS fields
	Module  string
	BaseURL string

	// temporary
	backend.StreamHandler
}

func New(jsonData pluginLib.JSONData, class pluginLib.Class, pluginDir string) PluginDTO {
	return PluginDTO{
		JSONData:  jsonData,
		Class:     class,
		pluginDir: pluginDir,
	}
}

func (p PluginDTO) SupportsStreaming() bool {
	return p.StreamHandler != nil
}

func (p PluginDTO) IsApp() bool {
	return p.Type == pluginLib.App
}

func (p PluginDTO) IsCorePlugin() bool {
	return p.Class == pluginLib.Core
}

func (p PluginDTO) IsExternalPlugin() bool {
	return p.Class == pluginLib.External
}

func (p PluginDTO) IsSecretsManager() bool {
	return p.JSONData.Type == pluginLib.SecretsManager
}

func (p PluginDTO) File(name string) (fs.File, error) {
	cleanPath, err := util.CleanRelativePath(name)
	if err != nil {
		// CleanRelativePath should clean and make the path relative so this is not expected to fail
		return nil, err
	}

	absPluginDir, err := filepath.Abs(p.pluginDir)
	if err != nil {
		return nil, err
	}

	absFilePath := filepath.Join(absPluginDir, cleanPath)
	// Wrapping in filepath.Clean to properly handle
	// gosec G304 Potential file inclusion via variable rule.
	f, err := os.Open(filepath.Clean(absFilePath))
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ErrFileNotExist
		}
		return nil, err
	}
	return f, nil
}
