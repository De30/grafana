package historian

import (
	"math"
	"testing"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/ngalert/eval"
	"github.com/grafana/grafana/pkg/services/ngalert/models"
	"github.com/grafana/grafana/pkg/services/ngalert/state"
	"github.com/stretchr/testify/require"
)

func TestBuildAnnotations(t *testing.T) {
	t.Run("data wraps nil values when values are nil", func(t *testing.T) {
		logger := log.NewNopLogger()
		rule := &models.AlertRule{}
		states := []state.StateTransition{makeStateTransition()}
		states[0].State.Values = nil

		items := buildAnnotations(rule, states, logger)

		require.Len(t, items, 1)
		require.NotNil(t, items[0].Data)
		v, has := items[0].Data.MustMap()["values"]
		require.Nil(t, v)
		require.True(t, has)
	})

	t.Run("data approximately contains expected values", func(t *testing.T) {
		logger := log.NewNopLogger()
		rule := &models.AlertRule{}
		states := []state.StateTransition{makeStateTransition()}
		states[0].State.Values = map[string]float64{"a": 1.0, "b": 2.0}

		items := buildAnnotations(rule, states, logger)

		require.Len(t, items, 1)
		require.NotNil(t, items[0].Data)
		vs, _ := items[0].Data.MustMap()["values"]
		require.NotNil(t, vs)
		vals := vs.(*simplejson.Json).MustMap()
		require.InDelta(t, 1.0, vals["a"], 0.1)
		require.InDelta(t, 2.0, vals["b"], 0.1)
	})

	t.Run("data handles special float values", func(t *testing.T) {
		logger := log.NewNopLogger()
		rule := &models.AlertRule{}
		states := []state.StateTransition{makeStateTransition()}
		states[0].State.Values = map[string]float64{"a": 1.0, "nan": math.NaN(), "inf": math.Inf(1), "-inf": math.Inf(-1)}

		items := buildAnnotations(rule, states, logger)

		require.Len(t, items, 1)
		require.NotNil(t, items[0].Data)
		vs, _ := items[0].Data.MustMap()["values"]
		require.NotNil(t, vs)
		vals := vs.(*simplejson.Json).MustMap()
		require.InDelta(t, 1.0, vals["a"], 0.1)
		require.Equal(t, "NaN", vals["nan"])
		require.Equal(t, "+Inf", vals["inf"])
		require.Equal(t, "-Inf", vals["-inf"])
	})
}

func makeStateTransition() state.StateTransition {
	return state.StateTransition{
		State: &state.State{
			State: eval.Alerting,
		},
		PreviousState: eval.Normal,
	}
}
