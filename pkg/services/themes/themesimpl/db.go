package themesimpl

import (
	"encoding/json"
	"io/ioutil"
	"os"
	"path"

	"github.com/grafana/grafana/pkg/services/themes"
)

func (ts *Service) saveTheme(theme *themes.CustomThemeDTO) error {
	themePath, err := ts.getThemeFilePath(theme.UID)
	if err != nil {
		return err
	}

	jsonData, err := json.MarshalIndent(theme, "", " ")

	err = ioutil.WriteFile(themePath, jsonData, 0644)
	if err != nil {
		return err
	}

	return nil
}

func (ts *Service) loadTheme(uid string) (*themes.CustomThemeDTO, error) {
	themePath, err := ts.getThemeFilePath(uid)
	if err != nil {
		return nil, err
	}

	return ts.loadThemeFromFile(themePath)
}

func (ts *Service) loadThemeFromFile(file string) (*themes.CustomThemeDTO, error) {
	byteValue, err := ioutil.ReadFile(file)
	if err != nil {
		return nil, err
	}

	var theme themes.CustomThemeDTO
	if err := json.Unmarshal(byteValue, &theme); err != nil {
		return nil, err
	}

	return &theme, nil
}

func (ts *Service) getThemeFilePath(uid string) (string, error) {
	themesFolder, err := ts.getThemesFolderPath()
	if err != nil {
		return "", nil
	}
	themePath := path.Join(themesFolder, uid+".json")
	return themePath, nil
}

func (ts *Service) getThemesFolderPath() (string, error) {
	themesFolder := path.Join(ts.cfg.DataPath, "themes")

	if _, err := os.Stat(themesFolder); os.IsNotExist(err) {
		if err = os.MkdirAll(themesFolder, os.ModePerm); err != nil {
			return "", err
		}
	}

	return themesFolder, nil
}

func (ts *Service) deleteTheme(uid string) error {
	themePath, err := ts.getThemeFilePath(uid)
	if err != nil {
		return err
	}

	return os.Remove(themePath)
}
