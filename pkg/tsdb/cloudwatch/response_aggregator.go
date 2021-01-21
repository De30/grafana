package cloudwatch

import "github.com/aws/aws-sdk-go/service/cloudwatch"

type responseAggregator struct {
	Id                      string
	RequestExceededMaxLimit bool
	PartialData             bool
	Labels                  []string
	ArithmeticError         bool
	Metrics                 map[string]*cloudwatch.MetricDataResult
}

func newAggregatedResponse(id string) responseAggregator {
	return responseAggregator{
		Id:                      id,
		RequestExceededMaxLimit: false,
		PartialData:             false,
		ArithmeticError:         false,
		Labels:                  []string{},
		Metrics:                 map[string]*cloudwatch.MetricDataResult{},
	}
}

func (r *responseAggregator) addMetricDataResult(mdr *cloudwatch.MetricDataResult) {
	label := *mdr.Label
	r.Labels = append(r.Labels, label)
	r.Metrics[label] = mdr
}

func (r *responseAggregator) appendTimeSeries(mdr *cloudwatch.MetricDataResult) {
	metric := r.Metrics[*mdr.Label]
	metric.Timestamps = append(metric.Timestamps, mdr.Timestamps...)
	metric.Values = append(metric.Values, mdr.Values...)
}

func (r *responseAggregator) checkDataStatus(mdr *cloudwatch.MetricDataResult) {
	metric := r.Metrics[*mdr.Label]
	if *mdr.StatusCode == "Complete" {
		metric.StatusCode = mdr.StatusCode
	} else {
		r.PartialData = true
	}
}
