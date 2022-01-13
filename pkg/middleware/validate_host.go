package middleware

import (
	"strings"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing/wrap"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
)

func ValidateHostHeader(cfg *setting.Cfg) web.Handler {
	return wrap.Wrap(func(c *models.ReqContext) response.Response {
		// ignore local render calls
		if c.IsRenderCall {
			return nil
		}

		h := c.Req.Host
		if i := strings.Index(h, ":"); i >= 0 {
			h = h[:i]
		}

		if !strings.EqualFold(h, cfg.Domain) {
			c.Redirect(strings.TrimSuffix(cfg.AppURL, "/")+c.Req.RequestURI, 301)
			return nil
		}
		return nil
	})
}
