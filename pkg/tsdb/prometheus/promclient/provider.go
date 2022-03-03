package promclient

import (
	"fmt"
	"net/url"
	"path"
	"strings"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana/pkg/grafanaazuresdkgo"
	"github.com/grafana/grafana/pkg/tsdb/prometheus/middleware"
	"github.com/grafana/grafana/pkg/util/maputil"

	sdkhttpclient "github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana/pkg/infra/httpclient"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/prometheus/client_golang/api"
	apiv1 "github.com/prometheus/client_golang/api/prometheus/v1"
)

type Provider struct {
	settings       backend.DataSourceInstanceSettings
	jsonData       map[string]interface{}
	httpMethod     string
	clientProvider httpclient.Provider
	log            log.Logger
}

func NewProvider(
	settings backend.DataSourceInstanceSettings,
	jsonData map[string]interface{},
	clientProvider httpclient.Provider,
	log log.Logger,
) *Provider {
	httpMethod, _ := maputil.GetStringOptional(jsonData, "httpMethod")
	return &Provider{
		settings:       settings,
		jsonData:       jsonData,
		httpMethod:     httpMethod,
		clientProvider: clientProvider,
		log:            log,
	}
}

func (p *Provider) GetClient(headers map[string]string) (apiv1.API, error) {
	opts, err := p.settings.HTTPClientOptions()
	if err != nil {
		return nil, err
	}

	middlewares, err := p.middlewares()
	if err != nil {
		return nil, err
	}

	opts.Middlewares = middlewares
	opts.Headers = reqHeaders(headers)

	// Set SigV4 service namespace
	if opts.SigV4 != nil {
		opts.SigV4.Service = "aps"
	}

	roundTripper, err := p.clientProvider.GetTransport(opts)
	if err != nil {
		return nil, err
	}

	cfg := api.Config{
		Address:      p.settings.URL,
		RoundTripper: roundTripper,
	}

	client, err := api.NewClient(cfg)
	if err != nil {
		return nil, err
	}

	return apiv1.NewAPI(client), nil
}

func (p *Provider) middlewares() ([]sdkhttpclient.Middleware, error) {
	middlewares := []sdkhttpclient.Middleware{
		middleware.CustomQueryParameters(p.log),
		sdkhttpclient.CustomHeadersMiddleware(),
	}
	if strings.ToLower(p.httpMethod) == "get" {
		middlewares = append(middlewares, middleware.ForceHttpGet(p.log))
	}

	azureAuthMiddleware, err := p.createAzureAuthMiddleware()
	if err != nil {
		return nil, err
	}

	if azureAuthMiddleware != nil {
		middlewares = append(middlewares, azureAuthMiddleware)
	}

	return middlewares, nil
}

func (p *Provider) createAzureAuthMiddleware() (sdkhttpclient.Middleware, error) {
	resourceId, err := maputil.GetStringOptional(p.jsonData, "azureEndpointResourceId")
	if err != nil {
		return nil, err
	}

	if resourceId == "" {
		return nil, nil
	}

	resourceIdURL, err := url.Parse(resourceId)
	if err != nil || resourceIdURL.Scheme == "" || resourceIdURL.Host == "" {
		return nil, fmt.Errorf("invalid endpoint Resource ID URL '%s'", resourceId)
	}
	resourceIdURL.Path = path.Join(resourceIdURL.Path, ".default")
	scopes := []string{resourceIdURL.String()}

	return grafanaazuresdkgo.NewAzureMiddleware(scopes)
}

func reqHeaders(headers map[string]string) map[string]string {
	// copy to avoid changing the original map
	h := make(map[string]string, len(headers))
	for k, v := range headers {
		h[k] = v
	}
	return h
}
