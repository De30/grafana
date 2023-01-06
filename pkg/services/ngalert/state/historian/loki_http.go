package historian

import (
	"fmt"
	"net/http"
	"net/url"

	"github.com/grafana/grafana/pkg/infra/log"
)

type httpLokiClient struct {
	client http.Client
	url    *url.URL
	log    log.Logger
}

func newLokiClient(u *url.URL, logger log.Logger) *httpLokiClient {
	return &httpLokiClient{
		client: http.Client{},
		url:    u,
		log:    logger.New("protocol", "http"),
	}
}

func (c *httpLokiClient) ping() error {
	uri := c.url.JoinPath("/loki/api/v1/status/buildinfo")
	req, err := http.NewRequest(http.MethodGet, uri.String(), nil)
	if err != nil {
		return fmt.Errorf("error creating request: %w", err)
	}

	res, err := c.client.Do(req)
	if err != nil {
		return fmt.Errorf("error sending request: %w", err)
	}

	if res.StatusCode < 200 || res.StatusCode >= 300 {
		return fmt.Errorf("request to the loki buildinfo endpoint returned a non-200 status code: %d", res.StatusCode)
	}
	c.log.Debug("Request to Loki buildinfo endpoint succeeded", "status", res.StatusCode)
	return nil
}
