package setting

import (
	"strconv"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"

	"github.com/grafana/grafana/pkg/util"
	"gopkg.in/ini.v1"
)

var (
	featureToggleInfo = promauto.NewGaugeVec(prometheus.GaugeOpts{
		Name:      "feature_toggles_info",
		Help:      "an info metric that exposes what feature toggles are enabled or not",
		Namespace: "grafana",
	}, []string{"name"})
)

func (cfg *Cfg) readFeatureToggles(iniFile *ini.File) error {
	// Read and populate feature toggles list
	featureTogglesSection := iniFile.Section("feature_toggles")
	cfg.FeatureToggles = make(map[string]bool)
	featuresTogglesStr := valueAsString(featureTogglesSection, "enable", "")
	for _, feature := range util.SplitString(featuresTogglesStr) {
		cfg.FeatureToggles[feature] = true
	}

	// read all settings under [feature_toggles] and override the array values
	for _, v := range featureTogglesSection.Keys() {
		if v.Name() == "enable" {
			continue
		}

		b, err := strconv.ParseBool(v.Value())
		if err != nil {
			return err
		}

		cfg.FeatureToggles[v.Name()] = b
	}

	for k, v := range cfg.FeatureToggles {
		if v == true {
			featureToggleInfo.WithLabelValues(k).Set(1)
		} else {
			featureToggleInfo.WithLabelValues(k).Set(0)
		}
	}

	return nil
}
