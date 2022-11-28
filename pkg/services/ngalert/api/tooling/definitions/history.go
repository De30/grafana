package definitions

import "github.com/grafana/grafana-plugin-sdk-go/data"

// swagger:route GET /api/ruler/grafana/states history RouteGetStateHistory
//
// Query state history.
//
//     Produces:
//     - application/json
//
//     Responses:
//       200: StateHistory

// swagger:route GET /api/ruler/grafana/states/{RuleUID} history RouteGetRuleStateHistory
//
// Query state history for a rule.
//
//     Produces:
//     - application/json
//
//     Responses:
//       200: StateHistory

type StateHistory struct {
	Results *data.Frame `json:"results"`
}
