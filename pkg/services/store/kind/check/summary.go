package check

import (
	"context"

	"github.com/grafana/grafana/pkg/kindsys"
	"github.com/grafana/grafana/pkg/registry/corekind"
)

func getSummarizer() kindsys.Summarizer {
	return func(ctx context.Context, uid string, body []byte) (*kindsys.EntitySummary, []byte, error) {
		k := corekind.NewBase(nil).Check()

		obj, _, err := k.JSONValueMux(body)
		if err != nil {
			return nil, nil, err
		}

		return &kindsys.EntitySummary{
			UID:    uid,
			Kind:   "Check",
			Labels: toStrmap(obj.Labels),
		}, body, nil
	}
}

func toStrmap(m map[string]any) map[string]string {
	nm := make(map[string]string, len(m))
	for k, v := range m {
		nm[k] = v.(string)
	}
	return nm
}
