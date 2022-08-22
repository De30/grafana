package prometheus

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/datasource"
	"github.com/grafana/grafana-plugin-sdk-go/backend/instancemgmt"
	"github.com/grafana/grafana/pkg/infra/httpclient"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	sdkhttpclient "github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana/pkg/tsdb/prometheus/middleware"
	"github.com/grafana/grafana/pkg/tsdb/prometheus/utils"
	"github.com/grafana/grafana/pkg/util/maputil"
	"github.com/grafana/grafana/pkg/tsdb/prometheus/querydata"
	"github.com/grafana/grafana/pkg/tsdb/prometheus/querydata/azureauth"
	"github.com/grafana/grafana/pkg/tsdb/prometheus/resource"
	apiv1 "github.com/prometheus/client_golang/api/prometheus/v1"
	"github.com/yudai/gojsondiff"
	"github.com/yudai/gojsondiff/formatter"
)

var plog = log.New("tsdb.prometheus")

type Service struct {
	im       instancemgmt.InstanceManager
	features featuremgmt.FeatureToggles
}

type instance struct {
	queryData *querydata.QueryData
	resource  *resource.Resource
}

func ProvideService(httpClientProvider httpclient.Provider, cfg *setting.Cfg, features featuremgmt.FeatureToggles, tracer tracing.Tracer) *Service {
	plog.Debug("initializing")
	return &Service{
		im:       datasource.NewInstanceManager(newInstanceSettings(httpClientProvider, cfg, features, tracer)),
		features: features,
	}
}

func newInstanceSettings(httpClientProvider httpclient.Provider, cfg *setting.Cfg, features featuremgmt.FeatureToggles, tracer tracing.Tracer) datasource.InstanceFactoryFunc {
	return func(settings backend.DataSourceInstanceSettings) (instancemgmt.Instance, error) {
		// Creates a http roundTripper.
		opts, err := CreateTransportOptions(settings, cfg, plog)
		if err != nil {
			return nil, fmt.Errorf("error creating transport options: %v", err)
		}
		httpClient, err := httpClientProvider.New(*opts)
		if err != nil {
			return nil, fmt.Errorf("error creating http client: %v", err)
		}

		// Custom client for better timing and parsing response
		qd, err := querydata.New(httpClient, features, tracer, settings, plog)
		if err != nil {
			return nil, err
		}

		// Resource call management using new custom client same as querydata
		r, err := resource.New(httpClient, settings, plog)
		if err != nil {
			return nil, err
		}

		return instance{
			queryData: qd,
			resource:  r,
		}, nil
	}
}

func (s *Service) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	if len(req.Queries) == 0 {
		return &backend.QueryDataResponse{}, fmt.Errorf("query contains no queries")
	}

	i, err := s.getInstance(req.PluginContext)
	if err != nil {
		return nil, err
	}

	return i.queryData.Execute(ctx, req)
}

func (s *Service) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	i, err := s.getInstance(req.PluginContext)
	if err != nil {
		return err
	}

	resp, err := i.resource.Execute(ctx, req)
	if err != nil {
		return err
	}

	return sender.Send(resp)
}

func (s *Service) getInstance(pluginCtx backend.PluginContext) (*instance, error) {
	i, err := s.im.Get(pluginCtx)
	if err != nil {
		return nil, err
	}
	in := i.(instance)
	return &in, nil
}

// IsAPIError returns whether err is or wraps a Prometheus error.
func IsAPIError(err error) bool {
	// Check if the right error type is in err's chain.
	var e *apiv1.Error
	return errors.As(err, &e)
}

func ConvertAPIError(err error) error {
	var e *apiv1.Error
	if errors.As(err, &e) {
		return fmt.Errorf("%s: %s", e.Msg, e.Detail)
	}
	return err
}

func CreateTransportOptions(settings backend.DataSourceInstanceSettings, cfg *setting.Cfg, logger log.Logger) (*sdkhttpclient.Options, error) {
	opts, err := settings.HTTPClientOptions()
	if err != nil {
		return nil, err
	}

	jsonData, err := utils.GetJsonData(settings)
	if err != nil {
		return nil, fmt.Errorf("error reading settings: %w", err)
	}
	httpMethod, _ := maputil.GetStringOptional(jsonData, "httpMethod")

	opts.Middlewares = middlewares(logger, httpMethod)

	// Set SigV4 service namespace
	if opts.SigV4 != nil {
		opts.SigV4.Service = "aps"
	}

	// Set Azure authentication
	if cfg.AzureAuthEnabled {
		err = azureauth.ConfigureAzureAuthentication(settings, cfg.Azure, &opts)
		if err != nil {
			return nil, fmt.Errorf("error configuring Azure auth: %v", err)
		}
	}

	return &opts, nil
}

func middlewares(logger log.Logger, httpMethod string) []sdkhttpclient.Middleware {
	middlewares := []sdkhttpclient.Middleware{
		// TODO: probably isn't needed anymore and should by done by http infra code
		middleware.CustomQueryParameters(logger),
		sdkhttpclient.CustomHeadersMiddleware(),
	}

	// Needed to control GET vs POST method of the requests
	if strings.ToLower(httpMethod) == "get" {
		middlewares = append(middlewares, middleware.ForceHttpGet(logger))
	}

	return middlewares
}

func reportDiff(data *backend.QueryDataResponse, err error, streamData *backend.QueryDataResponse, streamError error) {
	if err == nil && streamError != nil {
		plog.Debug("PrometheusStreamingJSONParserTest error in streaming client", "err", streamError)
	}

	if err != nil && streamError == nil {
		plog.Debug("PrometheusStreamingJSONParserTest error in buffer but not streaming", "err", err)
	}

	if !reflect.DeepEqual(data, streamData) {
		plog.Debug("PrometheusStreamingJSONParserTest buffer and streaming data are different")
		dataJson, jsonErr := json.MarshalIndent(data, "", "\t")
		if jsonErr != nil {
			plog.Debug("PrometheusStreamingJSONParserTest error marshaling data", "jsonErr", jsonErr)
		}
		streamingJson, jsonErr := json.MarshalIndent(streamData, "", "\t")
		if jsonErr != nil {
			plog.Debug("PrometheusStreamingJSONParserTest error marshaling streaming data", "jsonErr", jsonErr)
		}
		differ := gojsondiff.New()
		d, diffErr := differ.Compare(dataJson, streamingJson)
		if diffErr != nil {
			plog.Debug("PrometheusStreamingJSONParserTest diff error", "err", diffErr)
		}
		config := formatter.AsciiFormatterConfig{
			ShowArrayIndex: true,
			Coloring:       true,
		}

		var aJson map[string]interface{}
		unmarshallErr := json.Unmarshal(dataJson, &aJson)
		if unmarshallErr != nil {
			plog.Debug("PrometheusStreamingJSONParserTest unmarshall error", "err", unmarshallErr)
		}
		formatter := formatter.NewAsciiFormatter(aJson, config)
		diffString, diffErr := formatter.Format(d)
		if diffErr != nil {
			plog.Debug("PrometheusStreamingJSONParserTest diff format error", "err", diffErr)
		}
		fmt.Println(diffString)
	} else {
		plog.Debug("PrometheusStreamingJSONParserTest responses are the same")
	}
}
