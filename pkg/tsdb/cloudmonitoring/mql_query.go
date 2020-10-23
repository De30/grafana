package cloudmonitoring

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana/pkg/components/null"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/tsdb"
	"github.com/grafana/grafana/pkg/tsdb/sqleng"
	"github.com/opentracing/opentracing-go"
	"golang.org/x/net/context/ctxhttp"
)

func (query cloudMonitoringMqlQuery) executeQuery(ctx context.Context, tsdbQuery *tsdb.TsdbQuery, e *CloudMonitoringExecutor) (*tsdb.QueryResult, cloudMonitoringResponse, error) {
	queryResult := &tsdb.QueryResult{Meta: simplejson.New(), RefId: query.RefID}
	projectName := query.ProjectName
	if projectName == "" {
		defaultProject, err := e.getDefaultProject(ctx)
		if err != nil {
			queryResult.Error = err
			return queryResult, cloudMonitoringResponse{}, nil
		}
		projectName = defaultProject
		slog.Info("No project name set on query, using project name from datasource", "projectName", projectName)
	}

	from, err := tsdbQuery.TimeRange.ParseFrom()
	if err != nil {
		queryResult.Error = err
		return queryResult, cloudMonitoringResponse{}, nil
	}
	to, err := tsdbQuery.TimeRange.ParseTo()
	if err != nil {
		queryResult.Error = err
		return queryResult, cloudMonitoringResponse{}, nil
	}
	intervalCalculator := tsdb.NewIntervalCalculator(&tsdb.IntervalOptions{})
	interval := intervalCalculator.Calculate(tsdbQuery.TimeRange, time.Duration(query.IntervalMs/1000)*time.Second)
	timeFormat := "2006/01/02-15:04:05"
	query.Query += fmt.Sprintf(" | graph_period %s | within d'%s', d'%s'", interval.Text, from.UTC().Format(timeFormat), to.UTC().Format(timeFormat))

	buf, err := json.Marshal(map[string]interface{}{
		"query": query.Query,
	})
	if err != nil {
		queryResult.Error = err
		return queryResult, cloudMonitoringResponse{}, nil
	}
	req, err := e.createRequest(ctx, e.dsInfo, path.Join("cloudmonitoringv3/projects", projectName, "timeSeries:query"), bytes.NewBuffer(buf))
	if err != nil {
		queryResult.Error = err
		return queryResult, cloudMonitoringResponse{}, nil
	}

	queryResult.Meta.Set(sqleng.MetaKeyExecutedQueryString, query.Query)

	span, ctx := opentracing.StartSpanFromContext(ctx, "cloudMonitoring mql query")
	span.SetTag("query", query.Query)
	span.SetTag("from", tsdbQuery.TimeRange.From)
	span.SetTag("until", tsdbQuery.TimeRange.To)
	span.SetTag("datasource_id", e.dsInfo.Id)
	span.SetTag("org_id", e.dsInfo.OrgId)

	defer span.Finish()

	if err := opentracing.GlobalTracer().Inject(
		span.Context(),
		opentracing.HTTPHeaders,
		opentracing.HTTPHeadersCarrier(req.Header)); err != nil {
		queryResult.Error = err
		return queryResult, cloudMonitoringResponse{}, nil
	}

	res, err := ctxhttp.Do(ctx, e.httpClient, req)
	if err != nil {
		queryResult.Error = err
		return queryResult, cloudMonitoringResponse{}, nil
	}

	data, err := query.unmarshalResponse(res)
	if err != nil {
		queryResult.Error = err
		return queryResult, cloudMonitoringResponse{}, nil
	}

	return queryResult, data, nil
}

func (query cloudMonitoringMqlQuery) unmarshalResponse(res *http.Response) (cloudMonitoringResponse, error) {
	body, err := ioutil.ReadAll(res.Body)
	defer res.Body.Close()
	if err != nil {
		return cloudMonitoringResponse{}, err
	}

	if res.StatusCode/100 != 2 {
		slog.Error("Request failed", "status", res.Status, "body", string(body))
		return cloudMonitoringResponse{}, fmt.Errorf(string(body))
	}

	var data cloudMonitoringResponse
	err = json.Unmarshal(body, &data)
	if err != nil {
		slog.Error("Failed to unmarshal CloudMonitoring response", "error", err, "status", res.Status, "body", string(body))
		return cloudMonitoringResponse{}, err
	}

	return data, nil
}

func (query cloudMonitoringMqlQuery) parseResponse(queryRes *tsdb.QueryResult, data cloudMonitoringResponse) error {
	labels := make(map[string]map[string]bool)

	for _, series := range data.TimeSeriesData {
		seriesLabels := make(map[string]string)
		defaultMetricName := ""

		for n, d := range data.TimeSeriesDescriptor.LabelDescriptors {
			key := toSnakeCase(d.Key)
			if _, ok := labels[key]; !ok {
				labels[key] = map[string]bool{}
			}

			labelValue := series.LabelValues[n]
			switch d.ValueType {
			case "BOOL":
				strVal := strconv.FormatBool(labelValue.BoolValue)
				labels[key][strVal] = true
				seriesLabels[key] = strVal
			case "INT64":
				intVal := strconv.FormatInt(labelValue.Int64Value, 10)
				labels[key][intVal] = true
				seriesLabels[key] = intVal
			default:
				labels[key][labelValue.StringValue] = true
				seriesLabels[key] = labelValue.StringValue
			}
		}

		for n, d := range data.TimeSeriesDescriptor.PointDescriptors {
			if d.ValueType != "DISTRIBUTION" {
				points := make([]tsdb.TimePoint, 0)
				// reverse the order to be ascending
				for i := len(series.PointData) - 1; i >= 0; i-- {
					point := series.PointData[i]
					value := point.Values[n].DoubleValue

					if d.ValueType == "INT64" {
						parsedValue, err := strconv.ParseFloat(point.Values[n].Int64Value, 64)
						if err == nil {
							value = parsedValue
						}
					} else if d.ValueType == "BOOL" {
						if point.Values[n].BoolValue {
							value = 1
						} else {
							value = 0
						}
					}

					points = append(points, tsdb.NewTimePoint(null.FloatFrom(value), float64(point.TimeInterval.EndTime.Unix())*1000))
				}

				metricName := formatLegendKeys(d.MetricKind, defaultMetricName, seriesLabels, nil, &cloudMonitoringQuery{ProjectName: query.ProjectName, AliasBy: query.AliasBy})

				queryRes.Series = append(queryRes.Series, &tsdb.TimeSeries{
					Name:   metricName,
					Points: points,
				})
			} else {
				buckets := make(map[int]*tsdb.TimeSeries)
				// reverse the order to be ascending
				for i := len(series.PointData) - 1; i >= 0; i-- {
					point := series.PointData[i]
					if len(point.Values[n].DistributionValue.BucketCounts) == 0 {
						continue
					}
					maxKey := 0
					for i := 0; i < len(point.Values[n].DistributionValue.BucketCounts); i++ {
						value, err := strconv.ParseFloat(point.Values[n].DistributionValue.BucketCounts[i], 64)
						if err != nil {
							continue
						}
						if _, ok := buckets[i]; !ok {
							// set lower bounds
							// https://cloud.google.com/monitoring/api/ref_v3/rest/v3/TimeSeries#Distribution
							bucketBound := calcBucketBound(point.Values[n].DistributionValue.BucketOptions, i)
							additionalLabels := map[string]string{"bucket": bucketBound}
							buckets[i] = &tsdb.TimeSeries{
								Name:   formatLegendKeys(d.MetricKind, defaultMetricName, nil, additionalLabels, &cloudMonitoringQuery{ProjectName: query.ProjectName, AliasBy: query.AliasBy}),
								Points: make([]tsdb.TimePoint, 0),
							}
							if maxKey < i {
								maxKey = i
							}
						}
						buckets[i].Points = append(buckets[i].Points, tsdb.NewTimePoint(null.FloatFrom(value), float64(point.TimeInterval.EndTime.Unix())*1000))
					}

					// fill empty bucket
					for i := 0; i < maxKey; i++ {
						if _, ok := buckets[i]; !ok {
							bucketBound := calcBucketBound(point.Values[n].DistributionValue.BucketOptions, i)
							additionalLabels := map[string]string{"bucket": bucketBound}
							buckets[i] = &tsdb.TimeSeries{
								Name:   formatLegendKeys(d.MetricKind, defaultMetricName, seriesLabels, additionalLabels, &cloudMonitoringQuery{ProjectName: query.ProjectName, AliasBy: query.AliasBy}),
								Points: make([]tsdb.TimePoint, 0),
							}
						}
					}
				}
				for i := 0; i < len(buckets); i++ {
					queryRes.Series = append(queryRes.Series, buckets[i])
				}
			}
		}
	}

	labelsByKey := make(map[string][]string)
	for key, values := range labels {
		for value := range values {
			labelsByKey[key] = append(labelsByKey[key], value)
		}
	}

	queryRes.Meta.Set("labels", labelsByKey)

	return nil
}

func (query cloudMonitoringMqlQuery) parseToAnnotations(queryRes *tsdb.QueryResult, data cloudMonitoringResponse, title string, text string, tags string) error {
	annotations := make([]map[string]string, 0)

	for _, series := range data.TimeSeriesData {
		metricLabels := make(map[string]string)
		resourceLabels := make(map[string]string)

		for n, d := range data.TimeSeriesDescriptor.LabelDescriptors {
			key := toSnakeCase(d.Key)
			labelValue := series.LabelValues[n]
			value := ""
			switch d.ValueType {
			case "BOOL":
				strVal := strconv.FormatBool(labelValue.BoolValue)
				value = strVal
			case "INT64":
				intVal := strconv.FormatInt(labelValue.Int64Value, 10)
				value = intVal
			default:
				value = labelValue.StringValue
			}
			if strings.Index(key, "metric.") == 0 {
				key = key[len("metric."):]
				metricLabels[key] = value
			} else if strings.Index(key, "resource.") == 0 {
				key = key[len("resource."):]
				resourceLabels[key] = value
			}
		}

		for n, d := range data.TimeSeriesDescriptor.PointDescriptors {
			// reverse the order to be ascending
			for i := len(series.PointData) - 1; i >= 0; i-- {
				point := series.PointData[i]
				value := strconv.FormatFloat(point.Values[n].DoubleValue, 'f', 6, 64)
				if d.ValueType == "STRING" {
					value = point.Values[n].StringValue
				}
				annotation := make(map[string]string)
				annotation["time"] = point.TimeInterval.EndTime.UTC().Format(time.RFC3339)
				annotation["title"] = formatAnnotationText(title, value, d.MetricKind, metricLabels, resourceLabels)
				annotation["tags"] = tags
				annotation["text"] = formatAnnotationText(text, value, d.MetricKind, metricLabels, resourceLabels)
				annotations = append(annotations, annotation)
			}
		}
	}

	transformAnnotationToTable(annotations, queryRes)
	return nil
}

func (query cloudMonitoringMqlQuery) buildDeepLink() string {
	u, err := url.Parse("https://console.cloud.google.com/monitoring/metrics-explorer")
	if err != nil {
		slog.Error("Failed to generate deep link: unable to parse metrics explorer URL", "ProjectName", query.ProjectName, "query", query.RefID)
		return ""
	}

	q := u.Query()
	q.Set("project", query.ProjectName)
	q.Set("Grafana_deeplink", "true")

	pageState := map[string]interface{}{
		"xyChart": map[string]interface{}{
			"constantLines": []string{},
			"dataSets": []map[string]interface{}{
				{
					"timeSeriesQuery": query.Query,
					"targetAxis":      "Y1",
					"plotType":        "LINE",
				},
			},
			"timeshiftDuration": "0s",
			"y1Axis": map[string]string{
				"label": "y1Axis",
				"scale": "LINEAR",
			},
		},
		"timeSelection": map[string]string{
			"timeRange": "custom",
			"start":     query.timeRange.MustGetFrom().Format(time.RFC3339Nano),
			"end":       query.timeRange.MustGetTo().Format(time.RFC3339Nano),
		},
	}

	blob, err := json.Marshal(pageState)
	if err != nil {
		slog.Error("Failed to generate deep link", "pageState", pageState, "ProjectName", query.ProjectName, "query", query.RefID)
		return ""
	}

	q.Set("pageState", string(blob))
	u.RawQuery = q.Encode()

	accountChooserURL, err := url.Parse("https://accounts.google.com/AccountChooser")
	if err != nil {
		slog.Error("Failed to generate deep link: unable to parse account chooser URL", "ProjectName", query.ProjectName, "query", query.RefID)
		return ""
	}
	accountChooserQuery := accountChooserURL.Query()
	accountChooserQuery.Set("continue", u.String())
	accountChooserURL.RawQuery = accountChooserQuery.Encode()

	return accountChooserURL.String()
}

func (query cloudMonitoringMqlQuery) getRefID() string {
	return query.RefID
}
