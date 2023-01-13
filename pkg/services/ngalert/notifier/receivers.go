package notifier

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/grafana/alerting/alerting"

	"github.com/go-openapi/strfmt"
	apimodels "github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/prometheus/alertmanager/api/v2/models"
	"github.com/prometheus/alertmanager/types"
)

var (
	ErrNoReceivers = errors.New("no receivers")
)

type TestReceiversResult struct {
	Alert     types.Alert
	Receivers []TestReceiverResult
	NotifedAt time.Time
}

type TestReceiverResult struct {
	Name    string
	Configs []TestReceiverConfigResult
}

type TestReceiverConfigResult struct {
	Name   string
	UID    string
	Status string
	Error  error
}

type InvalidReceiverError struct {
	Receiver *apimodels.PostableGrafanaReceiver
	Err      error
}

func (e InvalidReceiverError) Error() string {
	return fmt.Sprintf("the receiver is invalid: %s", e.Err)
}

type ReceiverTimeoutError struct {
	Receiver *apimodels.PostableGrafanaReceiver
	Err      error
}

func (e ReceiverTimeoutError) Error() string {
	return fmt.Sprintf("the receiver timed out: %s", e.Err)
}

func (am *Alertmanager) TestReceivers(ctx context.Context, c apimodels.TestReceiversConfigBodyParams) (*TestReceiversResult, error) {
	receivers := make([]*alerting.APIReceiver, 0, len(c.Receivers))
	for _, r := range c.Receivers {
		greceivers := make([]*alerting.GrafanaReceiver, 0, len(r.GrafanaManagedReceivers))
		for _, gr := range r.PostableGrafanaReceivers.GrafanaManagedReceivers {
			var settings map[string]string
			//TODO: We shouldn't need to do this marshalling.
			j, err := gr.Settings.MarshalJSON()
			if err != nil {
				return nil, fmt.Errorf("unable to marshal settings to JSON: %v", err)
			}

			err = json.Unmarshal(j, &settings)
			if err != nil {
				return nil, fmt.Errorf("unable to marshal settings into map: %v", err)
			}

			greceivers = append(greceivers, &alerting.GrafanaReceiver{
				UID:                   gr.UID,
				Name:                  gr.Name,
				Type:                  gr.Type,
				DisableResolveMessage: gr.DisableResolveMessage,
				Settings:              settings,
				SecureSettings:        gr.SecureSettings,
			})
		}
		receivers = append(receivers, &alerting.APIReceiver{
			ConfigReceiver: r.Receiver,
			GrafanaReceivers: alerting.GrafanaReceivers{
				Receivers: greceivers,
			},
		})
	}
	var alert *alerting.TestReceiversConfigAlertParams
	if c.Alert != nil {
		alert = &alerting.TestReceiversConfigAlertParams{Annotations: c.Alert.Annotations, Labels: c.Alert.Labels}
	}

	result, err := am.Base.TestReceivers(ctx, alerting.TestReceiversConfigBodyParams{
		Alert:     alert,
		Receivers: receivers,
	})

	if err != nil {
		return nil, err
	}

	resultReceivers := make([]TestReceiverResult, 0, len(result.Receivers))
	for _, resultReceiver := range result.Receivers {
		configs := make([]TestReceiverConfigResult, 0, len(resultReceiver.Configs))
		for _, c := range resultReceiver.Configs {
			configs = append(configs, TestReceiverConfigResult{
				Name:   c.Name,
				UID:    c.UID,
				Status: c.Status,
				Error:  c.Error,
			})
		}
		resultReceivers = append(resultReceivers, TestReceiverResult{
			Name:    resultReceiver.Name,
			Configs: configs,
		})
	}

	return &TestReceiversResult{
		Alert:     result.Alert,
		Receivers: resultReceivers,
		NotifedAt: result.NotifedAt,
	}, err
}

func (am *Alertmanager) GetReceivers(ctx context.Context) []apimodels.Receiver {
	am.reloadConfigMtx.RLock()
	defer am.reloadConfigMtx.RUnlock()

	var apiReceivers []apimodels.Receiver
	for _, rcv := range am.Base.GetReceivers() {
		// Build integrations slice for each receiver.
		integrations := make([]*models.Integration, 0, len(rcv.Integrations()))
		for _, integration := range rcv.Integrations() {
			name := integration.Name()
			sendResolved := integration.SendResolved()
			ts, d, err := integration.GetReport()
			integrations = append(integrations, &apimodels.Integration{
				Name:                      &name,
				SendResolved:              &sendResolved,
				LastNotifyAttempt:         strfmt.DateTime(ts),
				LastNotifyAttemptDuration: d.String(),
				LastNotifyAttemptError: func() string {
					if err != nil {
						return err.Error()
					}
					return ""
				}(),
			})
		}

		active := rcv.Active()
		name := rcv.Name()
		apiReceivers = append(apiReceivers, apimodels.Receiver{
			Active:       &active,
			Integrations: integrations,
			Name:         &name,
		})
	}

	return apiReceivers
}
