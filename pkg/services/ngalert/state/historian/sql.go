package historian

import (
	"context"
	"time"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/state"
)

type historyRecord struct {
	uid       string    `xorm:"pk 'uid'"`
	ruleUID   string    `xorm:"rule_uid"`
	orgID     int64     `xorm:"org_id"`
	state     string    `xorm:"state"`
	prevState string    `xorm:"prev_state"`
	at        time.Time `xorm:"at"`
	labels    []label   `xorm:"-"`
}

type label struct {
	name       string `xorm:"name"`
	value      string `xorm:"value"`
	historyUID string `xorm:"history_uid"`
}

type SqlStateHistorian struct {
	log log.Logger
}

func (s *SqlStateHistorian) RecordStates(ctx context.Context, rule *models.AlertRule, states []state.StateTransition) {
	logger := s.log.FromContext(ctx)
	records, _ := s.buildRecords(rule, states, logger) // TODO
	go s.writeHistory(ctx, records)
}

func (s *SqlStateHistorian) buildRecords(rule *models.AlertRule, states []state.StateTransition, logger log.Logger) ([]historyRecord, error) {
	records := make([]historyRecord, 0, len(states))
	for _, state := range states {
		uid := "TODO"
		filtered := removePrivateLabels(state.Labels)
		lbls := make([]label, 0, len(filtered))
		for n, v := range filtered {
			lbls = append(lbls, label{
				name:       n,
				value:      v,
				historyUID: uid,
			})
		}

		record := historyRecord{
			uid:       uid,
			ruleUID:   state.AlertRuleUID,
			orgID:     state.OrgID,
			state:     string(state.State.State),   // TODO
			prevState: string(state.PreviousState), // TODO
			at:        state.LastEvaluationTime,
			labels:    lbls,
		}
		records = append(records, record)
	}
	return records, nil
}

func (s *SqlStateHistorian) writeHistory(ctx context.Context, records []historyRecord) {
	// TODO
}
