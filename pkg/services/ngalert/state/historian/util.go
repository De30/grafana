package historian

import (
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

func removePrivateLabels(labels data.Labels) data.Labels {
	result := make(data.Labels)
	for k, v := range labels {
		if !strings.HasPrefix(k, "__") && !strings.HasSuffix(k, "__") {
			result[k] = v
		}
	}
	return result
}
