package plugins

import (
	"github.com/grafana/grafana-plugin-sdk-go/backend"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
)

func toEvaluator(ev backend.Evaluator) (ac.Evaluator, error) {
	if ev == nil {
		return nil, &noEvaluatorProvided{}
	}

	switch v := ev.(type) {
	case backend.PermissionEvaluator:
		return ac.EvalPermission(v.Action, v.Scopes...), nil
	case backend.AnyEvaluator:
		if len(v.AnyOf) == 0 {
			return nil, &actionRequiredError{}
		}
		anyOf := []ac.Evaluator{}
		for _, a := range v.AnyOf {
			acA, err := toEvaluator(a)
			if err != nil {
				return nil, err
			}
			anyOf = append(anyOf, acA)
		}
		return ac.EvalAny(anyOf...), nil
	case backend.AllEvaluator:
		if len(v.AllOf) == 0 {
			return nil, &actionRequiredError{}
		}
		allOf := []ac.Evaluator{}
		for _, a := range v.AllOf {
			acA, err := toEvaluator(a)
			if err != nil {
				return nil, err
			}
			allOf = append(allOf, acA)
		}
		return ac.EvalAll(allOf...), nil
	default:
		return nil, &unknownEvaluator{}
	}
}
