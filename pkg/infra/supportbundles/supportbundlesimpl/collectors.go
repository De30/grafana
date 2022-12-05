package supportbundlesimpl

import (
	"context"
	"encoding/json"

	"github.com/grafana/grafana/pkg/infra/supportbundles"
	"github.com/grafana/grafana/pkg/infra/usagestats"
	"github.com/grafana/grafana/pkg/setting"
)

func basicCollector(cfg *setting.Cfg) supportbundles.CollectorFunc {
	return func(ctx context.Context) (*supportbundles.SupportItem, error) {
		type basicInfo struct {
			Version string `json:"version"`
			Commit  string `json:"commit"`
		}

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

func settingsCollector(settings setting.Provider) supportbundles.CollectorFunc {
	return func(ctx context.Context) (*supportbundles.SupportItem, error) {
		current := settings.Current()
		data, err := json.Marshal(current)
		if err != nil {
			return nil, err
		}

		return &supportbundles.SupportItem{
			Filename:  "settings.json",
			FileBytes: data,
		}, nil
	}
}

func usageStatesCollector(stats usagestats.Service) supportbundles.CollectorFunc {
	return func(ctx context.Context) (*supportbundles.SupportItem, error) {
		report, err := stats.GetUsageReport(context.Background())
		if err != nil {
			return nil, err
		}

		data, err := json.Marshal(report)
		if err != nil {
			return nil, err
		}
		return &supportbundles.SupportItem{
			Filename:  "usage-stats.json",
			FileBytes: data,
		}, nil
	}
}
