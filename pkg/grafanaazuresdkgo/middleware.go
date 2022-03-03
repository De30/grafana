package grafanaazuresdkgo

import (
	"fmt"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	sdkhttpclient "github.com/grafana/grafana-plugin-sdk-go/backend/httpclient"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/azcredentials"
	"github.com/grafana/grafana/pkg/tsdb/azuremonitor/aztokenprovider"
)

const azureMiddlewareName = "AzureAuthentication.Provider"

type Settings struct {
	Cloud                   string
	ManagedIdentityEnabled  bool
	ManagedIdentityClientId string
}

type CredentialProvider func(settings Settings, opts sdkhttpclient.Options) (azcredentials.AzureCredentials, error)

type Option func(*AzureMiddleware)

type AzureMiddleware struct {
	scopes             []string
	settings           Settings
	credentialProvider CredentialProvider
}

func NewAzureMiddleware(scopes []string, opts ...Option) (sdkhttpclient.Middleware, error) {
	if len(scopes) == 0 {
		return nil, fmt.Errorf("scopes cannot be empty")
	}

	m := &AzureMiddleware{
		scopes: scopes,
		// Some defaults and/or by default try read from environment variables?
		settings: Settings{
			ManagedIdentityEnabled: false,
		},
		credentialProvider: DefaultCredentialProvider,
	}

	for _, opt := range opts {
		opt(m)
	}

	return sdkhttpclient.NamedMiddlewareFunc(azureMiddlewareName, m.CreateMiddleware), nil
}

func (am AzureMiddleware) CreateMiddleware(opts sdkhttpclient.Options, next http.RoundTripper) http.RoundTripper {
	credentials, err := am.credentialProvider(am.settings, opts)
	if err != nil {
		return errorResponse(err)
	}

	// hack for now reusing setting.Cfg to be able to reuse existing code
	cfg := &setting.Cfg{
		Azure: setting.AzureSettings{
			Cloud:                   am.settings.Cloud,
			ManagedIdentityEnabled:  am.settings.ManagedIdentityEnabled,
			ManagedIdentityClientId: am.settings.ManagedIdentityClientId,
		},
	}
	tokenProvider, err := aztokenprovider.NewAzureAccessTokenProvider(cfg, credentials)
	if err != nil {
		return errorResponse(err)
	}

	return aztokenprovider.ApplyAuth(tokenProvider, am.scopes, next)
}

func WithSettings(settings Settings) Option {
	return Option(func(am *AzureMiddleware) {
		am.settings = settings
	})
}

func WithCredentialProvider(credentialProvider CredentialProvider) Option {
	return Option(func(am *AzureMiddleware) {
		am.credentialProvider = credentialProvider
	})
}

func DefaultCredentialProvider(settings Settings, opts sdkhttpclient.Options) (azcredentials.AzureCredentials, error) {
	jsonData := backend.JSONDataFromHTTPClientOptions(opts)
	secureJSONData := backend.SecureJSONDataFromHTTPClientOptions(opts)
	credentials, err := azcredentials.FromDatasourceData(jsonData, secureJSONData)
	if err != nil {
		return nil, err
	}

	return credentials, nil
}

func errorResponse(err error) http.RoundTripper {
	return sdkhttpclient.RoundTripperFunc(func(req *http.Request) (*http.Response, error) {
		return nil, fmt.Errorf("invalid Azure configuration: %s", err)
	})
}
