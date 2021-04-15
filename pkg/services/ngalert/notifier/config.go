package notifier

import (
	"fmt"
	"io/ioutil"
	"math/rand"
	"os"
	"path/filepath"

	"github.com/grafana/alerting-api/pkg/api"
	"github.com/prometheus/alertmanager/config"
	"github.com/prometheus/alertmanager/pkg/labels"
	"github.com/prometheus/common/model"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/log"
)

func PersistTemplates(cfg *api.PostableUserConfig, path string) ([]string, bool, error) {
	if len(cfg.TemplateFiles) < 1 {
		return nil, false, nil
	}

	var templatesChanged bool
	pathSet := map[string]struct{}{}
	for name, content := range cfg.TemplateFiles {
		if name != filepath.Base(filepath.Clean(name)) {
			return nil, false, fmt.Errorf("template file name '%s' is not valid", name)
		}

		err := os.MkdirAll(path, 0750)
		if err != nil {
			return nil, false, fmt.Errorf("unable to create template directory %q: %s", path, err)
		}

		file := filepath.Join(path, name)
		pathSet[file] = struct{}{}

		// Check if the template file already exists and if it has changed
		// We can safeily ignore gosec here and we've previously checked the filename is clean
		// nolint:gosec
		if tmpl, err := ioutil.ReadFile(file); err == nil && string(tmpl) == content {
			// Templates file is the same we have, no-op and continue.
			continue
		} else if err != nil && !os.IsNotExist(err) {
			return nil, false, err
		}

		if err := ioutil.WriteFile(file, []byte(content), 0644); err != nil {
			return nil, false, fmt.Errorf("unable to create Alertmanager template file %q: %s", file, err)
		}
		// nolint:gosec

		templatesChanged = true
	}

	// Now that we have the list of _actual_ templates, let's remove the ones that we don't need.
	existingFiles, err := ioutil.ReadDir(path)
	if err != nil {
		log.Error("unable to read directory for deleting Alertmanager templates", "err", err, "path", path)
	}
	for _, existingFile := range existingFiles {
		p := filepath.Join(path, existingFile.Name())
		_, ok := pathSet[p]
		if !ok {
			templatesChanged = true
			err := os.Remove(p)
			if err != nil {
				log.Error("unable to delete template", "err", err, "file", p)
			}
		}
	}

	paths := make([]string, 0, len(pathSet))
	for path := range pathSet {
		paths = append(paths, path)
	}
	return paths, templatesChanged, nil
}

func Load(rawConfig []byte) (*api.PostableUserConfig, error) {
	//cfg := &api.PostableUserConfig{}
	//
	//if err := json.Unmarshal(rawConfig, cfg); err != nil {
	//	return nil, errors.Wrap(err, "unable to parse Alertmanager configuration")
	//}

	cfg := &api.PostableUserConfig{
		TemplateFiles: nil,
		AlertmanagerConfig: api.PostableApiAlertingConfig{
			Config: api.Config{
				Route: &config.Route{
					GroupBy:  []model.LabelName{"alertname"},
					Receiver: "slack_demo",
					Matchers: nil,
					Routes: []*config.Route{
						{
							GroupBy:  []model.LabelName{"alertname"},
							Receiver: "slack_demo",
							Matchers: config.Matchers{
								&labels.Matcher{
									Type:  labels.MatchEqual,
									Name:  "alertname",
									Value: "DemoAlert",
								},
							},
						},
						{
							GroupBy:  []model.LabelName{"alertname"},
							Receiver: "slack_demo",
							Matchers: config.Matchers{
								&labels.Matcher{
									Type:  labels.MatchEqual,
									Name:  "alertname",
									Value: "DemoAlert2",
								},
							},
						},
					},
				},
			},
			Receivers: nil,
		},
	}

	settings, err := simplejson.NewJson([]byte(`{"addresses": "ganesh@grafana.com"}`))
	if err != nil {
		return nil, err
	}

	settings2, err := simplejson.NewJson([]byte(`{"addresses": "ganesh+new@grafana.com"}`))
	if err != nil {
		return nil, err
	}

	settings3, err := simplejson.NewJson([]byte(`{"addresses": "ganesh+newest@grafana.com"}`))
	if err != nil {
		return nil, err
	}

	slackSettings, err := simplejson.NewJson([]byte(`{
		"url": "<url",
		"recipient": "#<channel>"
	}`))
	if err != nil {
		return nil, err
	}

	cfg.AlertmanagerConfig.Receivers = append(cfg.AlertmanagerConfig.Receivers,
		&api.PostableApiReceiver{
			Receiver: config.Receiver{
				Name: "demo_receiver",
			},
			PostableGrafanaReceivers: api.PostableGrafanaReceivers{
				GrafanaManagedReceivers: []*api.PostableGrafanaReceiver{
					{
						Uid:      "",
						Name:     fmt.Sprintf("demo_email_%d", rand.Int()),
						Type:     "email",
						Settings: settings,
					},
				},
			},
		},
		&api.PostableApiReceiver{
			Receiver: config.Receiver{
				Name: "demo_receiver2",
			},
			PostableGrafanaReceivers: api.PostableGrafanaReceivers{
				GrafanaManagedReceivers: []*api.PostableGrafanaReceiver{
					{
						Uid:      "",
						Name:     fmt.Sprintf("demo_email_%d", rand.Int()),
						Type:     "email",
						Settings: settings2,
					},
				},
			},
		},
		&api.PostableApiReceiver{
			Receiver: config.Receiver{
				Name: "demo_receiver3",
			},
			PostableGrafanaReceivers: api.PostableGrafanaReceivers{
				GrafanaManagedReceivers: []*api.PostableGrafanaReceiver{
					{
						Uid:      "",
						Name:     fmt.Sprintf("demo_email_%d", rand.Int()),
						Type:     "email",
						Settings: settings3,
					},
				},
			},
		},
		&api.PostableApiReceiver{
			Receiver: config.Receiver{
				Name: "slack_demo",
			},
			PostableGrafanaReceivers: api.PostableGrafanaReceivers{
				GrafanaManagedReceivers: []*api.PostableGrafanaReceiver{
					{
						Name:     fmt.Sprintf("slack_demo_%d", rand.Int()),
						Type:     "slack",
						Settings: slackSettings,
					},
				},
			},
		},
	)

	return cfg, nil
}
