package querydata

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"time"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/infra/httpclient"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tsdb/intervalv2"
	prometheusClient "github.com/grafana/grafana/pkg/tsdb/prometheus/client"
	"github.com/grafana/grafana/pkg/tsdb/prometheus/models"
	"github.com/grafana/grafana/pkg/util/maputil"
	"go.opentelemetry.io/otel/attribute"
)

const legendFormatAuto = "__auto"

var legendFormatRegexp = regexp.MustCompile(`\{\{\s*(.+?)\s*\}\}`)

type clientGetter func(map[string]string) (*prometheusClient.Client, error)

type ExemplarEvent struct {
	Time   time.Time
	Value  float64
	Labels map[string]string
}

type QueryData struct {
	intervalCalculator intervalv2.Calculator
	tracer             tracing.Tracer
	getClient          clientGetter
	log                log.Logger
	ID                 int64
	URL                string
	TimeInterval       string
	enableWideSeries   bool
}

func New(
	httpClientProvider httpclient.Provider,
	cfg *setting.Cfg,
	features featuremgmt.FeatureToggles,
	tracer tracing.Tracer,
	settings backend.DataSourceInstanceSettings,
	plog log.Logger,
) (*QueryData, error) {
	var jsonData map[string]interface{}
	if err := json.Unmarshal(settings.JSONData, &jsonData); err != nil {
		return nil, fmt.Errorf("error reading settings: %w", err)
	}

	timeInterval, err := maputil.GetStringOptional(jsonData, "timeInterval")
	if err != nil {
		return nil, err
	}

	provider := prometheusClient.NewProvider(settings, jsonData, httpClientProvider, cfg, features, plog)

	return &QueryData{
		intervalCalculator: intervalv2.NewCalculator(),
		tracer:             tracer,
		log:                plog,
		getClient:          provider.GetClient,
		TimeInterval:       timeInterval,
		ID:                 settings.ID,
		URL:                settings.URL,
		enableWideSeries:   features.IsEnabled(featuremgmt.FlagPrometheusWideSeries),
	}, nil
}

func (qd *QueryData) Execute(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	fromAlert := req.Headers["FromAlert"] == "true"
	result := backend.QueryDataResponse{
		Responses: backend.Responses{},
	}

	client, err := qd.getClient(req.Headers)
	if err != nil {
		return &result, err
	}

	for _, q := range req.Queries {
		query, err := models.Parse(q, qd.TimeInterval, qd.intervalCalculator, fromAlert)
		if err != nil {
			return &result, err
		}
		r, err := qd.fetch(ctx, client, query)
		if err != nil {
			return &result, err
		}
		if r == nil {
			qd.log.Debug("Received nil response from runQuery", "query", query.Expr)
			continue
		}
		result.Responses[q.RefID] = *r
	}

	return &result, nil
}

func (qd *QueryData) fetch(ctx context.Context, client *prometheusClient.Client, q *models.Query) (*backend.DataResponse, error) {
	qd.log.Debug("Sending query", "start", q.Start, "end", q.End, "step", q.Step, "query", q.Expr)

	traceCtx, span := qd.trace(ctx, q)
	defer span.End()

	response := &backend.DataResponse{
		Frames: data.Frames{},
		Error:  nil,
	}

	if q.RangeQuery {
		res, err := qd.rangeQuery(traceCtx, client, q)
		if err != nil {
			return nil, err
		}
		response.Frames = res.Frames
	}

	if q.InstantQuery {
		res, err := qd.instantQuery(traceCtx, client, q)
		if err != nil {
			return nil, err
		}
		response.Frames = append(response.Frames, res.Frames...)
	}

	if q.ExemplarQuery {
		res, err := qd.exemplarQuery(traceCtx, client, q)
		if err != nil {
			// If exemplar query returns error, we want to only log it and
			// continue with other results processing
			qd.log.Error("Exemplar query failed", "query", q.Expr, "err", err)
		}
		if res != nil {
			response.Frames = append(response.Frames, res.Frames...)
		}
	}

	return response, nil
}

func (qd *QueryData) rangeQuery(ctx context.Context, c *prometheusClient.Client, q *models.Query) (*backend.DataResponse, error) {
	res, err := c.QueryRange(ctx, q)
	if err != nil {
		return nil, err
	}
	return qd.parseResponse(ctx, q, res)
}

func (qd *QueryData) instantQuery(ctx context.Context, c *prometheusClient.Client, q *models.Query) (*backend.DataResponse, error) {
	res, err := c.QueryInstant(ctx, q)
	if err != nil {
		return nil, err
	}
	return qd.parseResponse(ctx, q, res)
}

func (qd *QueryData) exemplarQuery(ctx context.Context, c *prometheusClient.Client, q *models.Query) (*backend.DataResponse, error) {
	res, err := c.QueryExemplars(ctx, q)
	if err != nil {
		return nil, err
	}
	return qd.parseResponse(ctx, q, res)
}

func (qd *QueryData) trace(ctx context.Context, q *models.Query) (context.Context, tracing.Span) {
	traceCtx, span := qd.tracer.Start(ctx, "datasource.prometheus")
	span.SetAttributes("expr", q.Expr, attribute.Key("expr").String(q.Expr))
	span.SetAttributes("start_unixnano", q.Start, attribute.Key("start_unixnano").Int64(q.Start.UnixNano()))
	span.SetAttributes("stop_unixnano", q.End, attribute.Key("stop_unixnano").Int64(q.End.UnixNano()))
	return traceCtx, span
}
