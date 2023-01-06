package httpclientprovider

import (
	"fmt"
	"net/http"
	"time"

	sdkhttpclient "github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/metrics/metricutil"
	"github.com/grafana/grafana/pkg/infra/tracing"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/mwitkow/go-conntrack"
)

var newProviderFunc = sdkhttpclient.NewProvider

func ProvideService(cfg *setting.Cfg, validator models.PluginRequestValidator, tracer tracing.Tracer,
	features featuremgmt.FeatureToggles) *sdkhttpclient.Provider {
	return New(Config{
		BuildVersion:                     cfg.BuildVersion,
		DataProxyTimeout:                 cfg.DataProxyTimeout,
		DataProxyDialTimeout:             cfg.DataProxyDialTimeout,
		DataProxyTLSHandshakeTimeout:     cfg.DataProxyTLSHandshakeTimeout,
		DataProxyExpectContinueTimeout:   cfg.DataProxyExpectContinueTimeout,
		DataProxyMaxConnsPerHost:         cfg.DataProxyMaxConnsPerHost,
		DataProxyMaxIdleConns:            cfg.DataProxyMaxIdleConns,
		DataProxyKeepAlive:               cfg.DataProxyKeepAlive,
		DataProxyIdleConnTimeout:         cfg.DataProxyIdleConnTimeout,
		ResponseLimit:                    cfg.ResponseLimit,
		SigV4AuthEnabled:                 cfg.SigV4AuthEnabled,
		SigV4VerboseLogging:              cfg.SigV4VerboseLogging,
		PluginSettings:                   cfg.PluginSettings,
		SecureSocksDSProxyFeatureEnabled: features.IsEnabled(featuremgmt.FlagSecureSocksDatasourceProxy),
		SecureSocksDSProxy:               cfg.SecureSocksDSProxy,
	}, validator, tracer)
}

type Config struct {
	BuildVersion string

	DataProxyTimeout               int
	DataProxyDialTimeout           int
	DataProxyTLSHandshakeTimeout   int
	DataProxyExpectContinueTimeout int
	DataProxyMaxConnsPerHost       int
	DataProxyMaxIdleConns          int
	DataProxyKeepAlive             int
	DataProxyIdleConnTimeout       int
	ResponseLimit                  int64

	SigV4AuthEnabled    bool
	SigV4VerboseLogging bool

	PluginSettings setting.PluginSettings

	SecureSocksDSProxyFeatureEnabled bool
	SecureSocksDSProxy               setting.SecureSocksDSProxySettings
}

// New creates a new HTTP client provider with pre-configured middlewares.
func New(cfg Config, validator models.PluginRequestValidator, tracer tracing.Tracer) *sdkhttpclient.Provider {
	logger := log.New("httpclient")
	userAgent := fmt.Sprintf("Grafana/%s", cfg.BuildVersion)

	middlewares := []sdkhttpclient.Middleware{
		TracingMiddleware(logger, tracer),
		DataSourceMetricsMiddleware(),
		sdkhttpclient.ContextualMiddleware(),
		SetUserAgentMiddleware(userAgent),
		sdkhttpclient.BasicAuthenticationMiddleware(),
		sdkhttpclient.CustomHeadersMiddleware(),
		ResponseLimitMiddleware(cfg.ResponseLimit),
		RedirectLimitMiddleware(validator),
	}

	if cfg.SigV4AuthEnabled {
		middlewares = append(middlewares, SigV4Middleware(cfg.SigV4VerboseLogging))
	}

	if httpLoggingEnabled(cfg.PluginSettings) {
		middlewares = append(middlewares, HTTPLoggerMiddleware(cfg.PluginSettings))
	}

	setDefaultTimeoutOptions(cfg)

	return newProviderFunc(sdkhttpclient.ProviderOptions{
		Middlewares: middlewares,
		ConfigureTransport: func(opts sdkhttpclient.Options, transport *http.Transport) {
			datasourceName, exists := opts.Labels["datasource_name"]
			if !exists {
				return
			}
			datasourceLabelName, err := metricutil.SanitizeLabelName(datasourceName)
			if err != nil {
				return
			}

			if cfg.SecureSocksDSProxyFeatureEnabled &&
				cfg.SecureSocksDSProxy.Enabled && secureSocksProxyEnabledOnDS(opts) {
				err = newSecureSocksProxy(&cfg.SecureSocksDSProxy, transport)
				if err != nil {
					logger.Error("Failed to enable secure socks proxy", "error", err.Error(), "datasource", datasourceName)
				}
			}

			newConntrackRoundTripper(datasourceLabelName, transport)
		},
	})
}

// newConntrackRoundTripper takes a http.DefaultTransport and adds the Conntrack Dialer
// so we can instrument outbound connections
func newConntrackRoundTripper(name string, transport *http.Transport) *http.Transport {
	transport.DialContext = conntrack.NewDialContextFunc(
		conntrack.DialWithName(name),
		conntrack.DialWithDialContextFunc(transport.DialContext),
	)
	return transport
}

// setDefaultTimeoutOptions overrides the default timeout options for the SDK.
//
// Note: Not optimal changing global state, but hard to not do in this case.
func setDefaultTimeoutOptions(cfg Config) {
	sdkhttpclient.DefaultTimeoutOptions = sdkhttpclient.TimeoutOptions{
		Timeout:               time.Duration(cfg.DataProxyTimeout) * time.Second,
		DialTimeout:           time.Duration(cfg.DataProxyDialTimeout) * time.Second,
		KeepAlive:             time.Duration(cfg.DataProxyKeepAlive) * time.Second,
		TLSHandshakeTimeout:   time.Duration(cfg.DataProxyTLSHandshakeTimeout) * time.Second,
		ExpectContinueTimeout: time.Duration(cfg.DataProxyExpectContinueTimeout) * time.Second,
		MaxConnsPerHost:       cfg.DataProxyMaxConnsPerHost,
		MaxIdleConns:          cfg.DataProxyMaxIdleConns,
		MaxIdleConnsPerHost:   cfg.DataProxyMaxIdleConns,
		IdleConnTimeout:       time.Duration(cfg.DataProxyIdleConnTimeout) * time.Second,
	}
}
