package clientmiddleware

import (
	"context"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/httpclient/httpclientprovider"
	"github.com/grafana/grafana/pkg/plugins"
	"github.com/grafana/grafana/pkg/services/contexthandler"
	"github.com/grafana/grafana/pkg/services/datasources"
	"github.com/grafana/grafana/pkg/util/proxyutil"
)

const cookieHeaderName = "Cookie"

// NewCookiesMiddleware creates a new plugins.ClientMiddleware that will
// forward incoming HTTP request Cookies to outgoing plugins.Client and
// HTTP requests if the datasource has enabled forwarding of cookies (keepCookies).
func NewCookiesMiddleware(skipCookiesNames []string) plugins.ClientMiddleware {
	return plugins.ClientMiddlewareFunc(func(next plugins.Client) plugins.Client {
		return &CookiesMiddleware{
			next:             next,
			skipCookiesNames: skipCookiesNames,
		}
	})
}

type CookiesMiddleware struct {
	next             plugins.Client
	skipCookiesNames []string
}

func (m *CookiesMiddleware) applyCookies(ctx context.Context, pCtx backend.PluginContext, req interface{}) (context.Context, error) {
	reqCtx := contexthandler.FromContext(ctx)
	// if request not for a datasource or no HTTP request context skip middleware
	if req == nil || pCtx.DataSourceInstanceSettings == nil || reqCtx == nil || reqCtx.Req == nil {
		return ctx, nil
	}

	settings := pCtx.DataSourceInstanceSettings
	jsonDataBytes, err := simplejson.NewJson(settings.JSONData)
	if err != nil {
		return ctx, err
	}

	ds := &datasources.DataSource{
		Id:       settings.ID,
		OrgId:    pCtx.OrgID,
		JsonData: jsonDataBytes,
		Updated:  settings.Updated,
	}

	proxyutil.ClearCookieHeader(reqCtx.Req, ds.AllowedCookies(), m.skipCookiesNames)

	if cookieStr := reqCtx.Req.Header.Get(cookieHeaderName); cookieStr != "" {
		switch t := req.(type) {
		case *backend.QueryDataRequest:
			t.Headers[cookieHeaderName] = cookieStr
		case *backend.CheckHealthRequest:
			t.Headers[cookieHeaderName] = cookieStr
		case *backend.CallResourceRequest:
			t.Headers[cookieHeaderName] = []string{cookieStr}
		}
	}

	ctx = httpclient.WithContextualMiddleware(ctx, httpclientprovider.ForwardedCookiesMiddleware(reqCtx.Req.Cookies(), ds.AllowedCookies(), m.skipCookiesNames))

	return ctx, nil
}

func (m *CookiesMiddleware) QueryData(ctx context.Context, req *backend.QueryDataRequest) (*backend.QueryDataResponse, error) {
	if req == nil {
		return m.next.QueryData(ctx, req)
	}

	newCtx, err := m.applyCookies(ctx, req.PluginContext, req)
	if err != nil {
		return nil, err
	}

	return m.next.QueryData(newCtx, req)
}

func (m *CookiesMiddleware) CallResource(ctx context.Context, req *backend.CallResourceRequest, sender backend.CallResourceResponseSender) error {
	if req == nil {
		return m.next.CallResource(ctx, req, sender)
	}

	newCtx, err := m.applyCookies(ctx, req.PluginContext, req)
	if err != nil {
		return err
	}

	return m.next.CallResource(newCtx, req, sender)
}

func (m *CookiesMiddleware) CheckHealth(ctx context.Context, req *backend.CheckHealthRequest) (*backend.CheckHealthResult, error) {
	if req == nil {
		return m.next.CheckHealth(ctx, req)
	}

	newCtx, err := m.applyCookies(ctx, req.PluginContext, req)
	if err != nil {
		return nil, err
	}

	return m.next.CheckHealth(newCtx, req)
}

func (m *CookiesMiddleware) CollectMetrics(ctx context.Context, req *backend.CollectMetricsRequest) (*backend.CollectMetricsResult, error) {
	return m.next.CollectMetrics(ctx, req)
}

func (m *CookiesMiddleware) SubscribeStream(ctx context.Context, req *backend.SubscribeStreamRequest) (*backend.SubscribeStreamResponse, error) {
	return m.next.SubscribeStream(ctx, req)
}

func (m *CookiesMiddleware) PublishStream(ctx context.Context, req *backend.PublishStreamRequest) (*backend.PublishStreamResponse, error) {
	return m.next.PublishStream(ctx, req)
}

func (m *CookiesMiddleware) RunStream(ctx context.Context, req *backend.RunStreamRequest, sender *backend.StreamSender) error {
	return m.next.RunStream(ctx, req, sender)
}
