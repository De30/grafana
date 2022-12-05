package supportbundlesimpl

import (
	"context"
	"encoding/json"

	"github.com/grafana/grafana/pkg/infra/supportbundles"
	"github.com/grafana/grafana/pkg/setting"
)

type basicInfo struct {
	Version string `json:"version"`
	Commit  string `json:"commit"`
}

func basicCollector(cfg *setting.Cfg) supportbundles.CollectorFunc {
	return func(ctx context.Context) (*supportbundles.SupportItem, error) {
		data, err := json.Marshal(basicInfo{
			Version: cfg.BuildVersion,
			Commit:  cfg.BuildCommit,
		})
		if err != nil {
			return nil, err
		}

		return &supportbundles.SupportItem{
			Filename:  "basic.json",
			FileBytes: data,
		}, nil
	}
}
