package cloudwatch

import (
	"testing"
	"time"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/tsdb"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRequestParser(t *testing.T) {
	t.Run("Query migration", func(t *testing.T) {
		queryContext := &tsdb.TsdbQuery{TimeRange: tsdb.NewTimeRange("5m", "now")}
		query := &tsdb.Query{
			MaxDataPoints: 0,
			QueryType:     "timeSeriesQuery",
			IntervalMs:    0,
			DataSource:    &models.DataSource{},
		}
		t.Run("old query model with two stats is being converted to two queries", func(t *testing.T) {
			oldQuery := query
			oldQuery.RefId = "A"
			oldQuery.Model = simplejson.NewFromAny(map[string]interface{}{
				"region":     "us-east-1",
				"namespace":  "ec2",
				"metricName": "CPUUtilization",
				"dimensions": map[string]interface{}{
					"InstanceId": []interface{}{"test"},
				},
				"statistics": []interface{}{"Average", "Sum"},
				"period":     "600",
				"hide":       false,
			})
			queryContext.Queries = []*tsdb.Query{oldQuery}
			res, err := migrateLegacyQuery(queryContext)
			require.NoError(t, err)
			newQuery := res.Queries[1]
			assert.Equal(t, 2, len(res.Queries))
			assert.Equal(t, "timeSeriesQuery", newQuery.QueryType)
			assert.Equal(t, int64(0), newQuery.IntervalMs)
			assert.Equal(t, int64(0), newQuery.MaxDataPoints)
			assert.Equal(t, "B", newQuery.RefId)
			assert.Equal(t, "us-east-1", newQuery.Model.Get("region").MustString())
			assert.Equal(t, "ec2", newQuery.Model.Get("namespace").MustString())
			assert.Equal(t, "CPUUtilization", newQuery.Model.Get("metricName").MustString())
			assert.Equal(t, "Sum", newQuery.Model.Get("statistic").MustString())
			assert.Equal(t, "600", newQuery.Model.Get("period").MustString())
		})
		t.Run("old query model with fours stats is being converted to four queries", func(t *testing.T) {
			oldQuery := query
			oldQuery.RefId = "A"
			oldQuery.Model = simplejson.NewFromAny(map[string]interface{}{
				"region":     "us-east-1",
				"namespace":  "ec2",
				"metricName": "CPUUtilization",
				"dimensions": map[string]interface{}{
					"InstanceId": []interface{}{"test"},
				},
				"statistics": []interface{}{"Average", "Sum", "Max", "Min"},
				"period":     "600",
				"hide":       false,
			})
			queryContext.Queries = []*tsdb.Query{oldQuery}
			res, err := migrateLegacyQuery(queryContext)
			require.NoError(t, err)
			assert.Equal(t, 4, len(res.Queries))
			assert.Equal(t, "Average", res.Queries[0].Model.Get("statistic").MustString())
			assert.Equal(t, "Sum", res.Queries[1].Model.Get("statistic").MustString())
			assert.Equal(t, "Max", res.Queries[2].Model.Get("statistic").MustString())
			assert.Equal(t, "Min", res.Queries[3].Model.Get("statistic").MustString())
		})
		t.Run("new refIds are being calculated correctly", func(t *testing.T) {
			queryContext.Queries = []*tsdb.Query{
				{
					RefId: "A",
					Model: simplejson.NewFromAny(map[string]interface{}{
						"statistics": []interface{}{"Average", "Sum"},
					}),
				},
				{
					RefId: "B",
					Model: simplejson.NewFromAny(map[string]interface{}{
						"statistics": []interface{}{"Max", "Min"},
					}),
				},
				{
					RefId: "D",
					Model: simplejson.NewFromAny(map[string]interface{}{
						"statistics": []interface{}{"p12.21"},
					}),
				},
			}
			res, err := migrateLegacyQuery(queryContext)
			require.NoError(t, err)
			assert.Equal(t, 5, len(res.Queries))

			query1 := res.Queries[0]
			assert.Equal(t, "A", query1.RefId)
			assert.Equal(t, "Average", query1.Model.Get("statistic").MustString())

			query2 := res.Queries[1]
			assert.Equal(t, "B", query2.RefId)
			assert.Equal(t, "Max", query2.Model.Get("statistic").MustString())

			query3 := res.Queries[2]
			assert.Equal(t, "D", query3.RefId)
			assert.Equal(t, "p12.21", query3.Model.Get("statistic").MustString())

			query4 := res.Queries[3]
			assert.Equal(t, "C", query4.RefId)
			assert.Equal(t, "Sum", query4.Model.Get("statistic").MustString())

			query5 := res.Queries[4]
			assert.Equal(t, "E", query5.RefId)
			assert.Equal(t, "Min", query5.Model.Get("statistic").MustString())
		})
	})

	timeRange := tsdb.NewTimeRange("now-1h", "now-2h")
	from, err := timeRange.ParseFrom()
	require.NoError(t, err)
	to, err := timeRange.ParseTo()
	require.NoError(t, err)

	t.Run("New dimensions structure", func(t *testing.T) {
		query := simplejson.NewFromAny(map[string]interface{}{
			"refId":      "ref1",
			"region":     "us-east-1",
			"namespace":  "ec2",
			"metricName": "CPUUtilization",
			"id":         "",
			"expression": "",
			"dimensions": map[string]interface{}{
				"InstanceId":   []interface{}{"test"},
				"InstanceType": []interface{}{"test2", "test3"},
			},
			"statistics": "Average",
			"period":     "600",
			"hide":       false,
		})

		res, err := parseRequestQuery(query, "ref1", from, to)
		require.NoError(t, err)
		assert.Equal(t, "us-east-1", res.Region)
		assert.Equal(t, "ref1", res.RefId)
		assert.Equal(t, "ec2", res.Namespace)
		assert.Equal(t, "CPUUtilization", res.MetricName)
		assert.Empty(t, res.Id)
		assert.Empty(t, res.Expression)
		assert.Equal(t, 600, res.Period)
		assert.True(t, res.ReturnData)
		assert.Len(t, res.Dimensions, 2)
		assert.Len(t, res.Dimensions["InstanceId"], 1)
		assert.Len(t, res.Dimensions["InstanceType"], 2)
		assert.Equal(t, "test3", res.Dimensions["InstanceType"][1])
		assert.Len(t, res.Statistics, 1)
		assert.Equal(t, "Average", *res.Statistics[0])
	})

	t.Run("Old dimensions structure (backwards compatibility)", func(t *testing.T) {
		query := simplejson.NewFromAny(map[string]interface{}{
			"refId":      "ref1",
			"region":     "us-east-1",
			"namespace":  "ec2",
			"metricName": "CPUUtilization",
			"id":         "",
			"expression": "",
			"dimensions": map[string]interface{}{
				"InstanceId":   "test",
				"InstanceType": "test2",
			},
			"statistics": "Average",
			"period":     "600",
			"hide":       false,
		})

		res, err := parseRequestQuery(query, "ref1", from, to)
		require.NoError(t, err)
		assert.Equal(t, "us-east-1", res.Region)
		assert.Equal(t, "ref1", res.RefId)
		assert.Equal(t, "ec2", res.Namespace)
		assert.Equal(t, "CPUUtilization", res.MetricName)
		assert.Empty(t, res.Id)
		assert.Empty(t, res.Expression)
		assert.Equal(t, 600, res.Period)
		assert.True(t, res.ReturnData)
		assert.Len(t, res.Dimensions, 2)
		assert.Len(t, res.Dimensions["InstanceId"], 1)
		assert.Len(t, res.Dimensions["InstanceType"], 1)
		assert.Equal(t, "test2", res.Dimensions["InstanceType"][0])
		assert.Equal(t, "Average", *res.Statistics[0])
	})

	t.Run("Period defined in the editor by the user is being used when time range is short", func(t *testing.T) {
		query := simplejson.NewFromAny(map[string]interface{}{
			"refId":      "ref1",
			"region":     "us-east-1",
			"namespace":  "ec2",
			"metricName": "CPUUtilization",
			"id":         "",
			"expression": "",
			"dimensions": map[string]interface{}{
				"InstanceId":   "test",
				"InstanceType": "test2",
			},
			"statistics": "Average",
			"hide":       false,
		})
		query.Set("period", "900")
		timeRange := tsdb.NewTimeRange("now-1h", "now-2h")
		from, err := timeRange.ParseFrom()
		require.NoError(t, err)
		to, err := timeRange.ParseTo()
		require.NoError(t, err)

		res, err := parseRequestQuery(query, "ref1", from, to)
		require.NoError(t, err)
		assert.Equal(t, 900, res.Period)
	})

	t.Run("Period is parsed correctly if not defined by user", func(t *testing.T) {
		query := simplejson.NewFromAny(map[string]interface{}{
			"refId":      "ref1",
			"region":     "us-east-1",
			"namespace":  "ec2",
			"metricName": "CPUUtilization",
			"id":         "",
			"expression": "",
			"dimensions": map[string]interface{}{
				"InstanceId":   "test",
				"InstanceType": "test2",
			},
			"statistics": "Average",
			"hide":       false,
			"period":     "auto",
		})

		t.Run("Time range is 5 minutes", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.Local().Add(time.Minute * time.Duration(5))

			res, err := parseRequestQuery(query, "ref1", from, to)
			require.NoError(t, err)
			assert.Equal(t, 60, res.Period)
		})

		t.Run("Time range is 1 day", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.AddDate(0, 0, -1)

			res, err := parseRequestQuery(query, "ref1", from, to)
			require.NoError(t, err)
			assert.Equal(t, 60, res.Period)
		})

		t.Run("Time range is 2 days", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.AddDate(0, 0, -2)
			res, err := parseRequestQuery(query, "ref1", from, to)
			require.NoError(t, err)
			assert.Equal(t, 300, res.Period)
		})

		t.Run("Time range is 7 days", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.AddDate(0, 0, -7)

			res, err := parseRequestQuery(query, "ref1", from, to)
			require.NoError(t, err)
			assert.Equal(t, 900, res.Period)
		})

		t.Run("Time range is 30 days", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.AddDate(0, 0, -30)

			res, err := parseRequestQuery(query, "ref1", from, to)
			require.NoError(t, err)
			assert.Equal(t, 3600, res.Period)
		})

		t.Run("Time range is 90 days", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.AddDate(0, 0, -90)

			res, err := parseRequestQuery(query, "ref1", from, to)
			require.NoError(t, err)
			assert.Equal(t, 21600, res.Period)
		})

		t.Run("Time range is 1 year", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.AddDate(-1, 0, 0)

			res, err := parseRequestQuery(query, "ref1", from, to)
			require.Nil(t, err)
			assert.Equal(t, 21600, res.Period)
		})

		t.Run("Time range is 2 years", func(t *testing.T) {
			query.Set("period", "auto")
			to := time.Now()
			from := to.AddDate(-2, 0, 0)

			res, err := parseRequestQuery(query, "ref1", from, to)
			require.NoError(t, err)
			assert.Equal(t, 86400, res.Period)
		})
	})
}
