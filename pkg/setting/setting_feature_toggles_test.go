package setting

import (
	"strconv"
	"testing"

	"github.com/stretchr/testify/require"
	"gopkg.in/ini.v1"
)

func TestFeatureToggles(t *testing.T) {
	testCases := []struct {
		name    string
		conf    map[string]string
		err     error
		toggles map[string]bool
	}{
		{
			name: "can parse feature toggles pass in the enable array",
			conf: map[string]string{
				"enable": "feature1,feature2",
			},
			toggles: map[string]bool{
				"feature1": true,
				"feature2": true,
			},
		},
		{
			name: "can parse feature toggles listed under [feature_toggles]",
			conf: map[string]string{
				"enable":   "feature1,feature2",
				"feature3": "true",
			},
			toggles: map[string]bool{
				"feature1": true,
				"feature2": true,
				"feature3": true,
			},
		},
		{
			name: "toggles listed under [feature_toggles] override those in the array",
			conf: map[string]string{
				"enable":   "feature1,feature2",
				"feature2": "false",
			},
			toggles: map[string]bool{
				"feature1": true,
				"feature2": false,
			},
		},
		{
			name: "invalid boolean value",
			conf: map[string]string{
				"enable":   "feature1,feature2",
				"feature2": "invalid",
			},
			toggles: map[string]bool{},
			err:     strconv.ErrSyntax,
		},
	}

	for _, tc := range testCases {
		f := ini.Empty()
		cfg := NewCfg()

		toggles, _ := f.NewSection("feature_toggles")
		for k, v := range tc.conf {
			toggles.NewKey(k, v)
		}

		err := cfg.readFeatureToggles(f)
		require.ErrorIs(t, err, tc.err)

		if err == nil {
			for k, v := range cfg.FeatureToggles {
				require.Equal(t, tc.toggles[k], v)
			}
		}
	}
}
