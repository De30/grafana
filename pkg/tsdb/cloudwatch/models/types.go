package models

import (
	"net/url"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
)

type RequestContext struct {
	MetricsClientProvider MetricsClientProvider
	Settings              CloudWatchSettings
}

type RequestContextFactoryFunc func(pluginCtx backend.PluginContext, region string) (reqCtx RequestContext, err error)

type RouteHandlerFunc func(pluginCtx backend.PluginContext, reqContextFactory RequestContextFactoryFunc, parameters url.Values) ([]byte, *HttpError)

type cloudWatchLink struct {
	View    string        `json:"view"`
	Stacked bool          `json:"stacked"`
	Title   string        `json:"title"`
	Start   string        `json:"start"`
	End     string        `json:"end"`
	Region  string        `json:"region"`
	Metrics []interface{} `json:"metrics"`
}

type metricExpression struct {
	Expression string `json:"expression"`
	Label      string `json:"label,omitempty"`
}

type metricStatMeta struct {
	Stat   string `json:"stat"`
	Period int    `json:"period"`
	Label  string `json:"label,omitempty"`
}
