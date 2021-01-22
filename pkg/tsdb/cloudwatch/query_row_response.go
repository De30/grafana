package cloudwatch

import "github.com/aws/aws-sdk-go/service/cloudwatch"

type queryRowResponse struct {
	ID                      string
	RequestExceededMaxLimit bool
	PartialData             bool
	Labels                  []string
	ArithmeticError         bool
	Metrics                 map[string]*cloudwatch.MetricDataResult
}

func newQueryRowResponse(id string) queryRowResponse {
	return queryRowResponse{
		ID:                      id,
		RequestExceededMaxLimit: false,
		PartialData:             false,
		ArithmeticError:         false,
		Labels:                  []string{},
		Metrics:                 map[string]*cloudwatch.MetricDataResult{},
	}
}

func (q *queryRowResponse) addMetricDataResult(mdr *cloudwatch.MetricDataResult) {
	label := *mdr.Label
	q.Labels = append(q.Labels, label)
	q.Metrics[label] = mdr
}

func (q *queryRowResponse) appendTimeSeries(mdr *cloudwatch.MetricDataResult) {
	metric := q.Metrics[*mdr.Label]
	metric.Timestamps = append(metric.Timestamps, mdr.Timestamps...)
	metric.Values = append(metric.Values, mdr.Values...)
}

func (q *queryRowResponse) checkDataStatus(mdr *cloudwatch.MetricDataResult) {
	metric := q.Metrics[*mdr.Label]
	if *mdr.StatusCode == "Complete" {
		metric.StatusCode = mdr.StatusCode
	} else {
		q.PartialData = true
	}
}
