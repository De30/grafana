package plugins

type noUserProvided struct{}

func (e *noUserProvided) Error() string {
	return "no user provided"
}

type noEvaluatorProvided struct{}

func (e *noEvaluatorProvided) Error() string {
	return "no evaluator provided"
}

type unknownEvaluator struct{}

func (e *unknownEvaluator) Error() string {
	return "unknown evaluator"
}

type actionRequiredError struct{}

func (e *actionRequiredError) Error() string {
	return "evaluator has no action"
}
