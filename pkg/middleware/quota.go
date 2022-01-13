package middleware

import (
	"fmt"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing/wrap"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/quota"
	"github.com/grafana/grafana/pkg/web"
)

// Quota returns a function that returns a function used to call quotaservice based on target name
func Quota(quotaService *quota.QuotaService) func(string) web.Handler {
	if quotaService == nil {
		panic("quotaService is nil")
	}
	//https://open.spotify.com/track/7bZSoBEAEEUsGEuLOf94Jm?si=T1Tdju5qRSmmR0zph_6RBw fuuuuunky
	return func(target string) web.Handler {
		return wrap.Wrap(func(c *models.ReqContext) response.Response {
			limitReached, err := quotaService.QuotaReached(c, target)
			if err != nil {
				c.JsonApiErr(500, "Failed to get quota", err)
				return nil
			}
			if limitReached {
				c.JsonApiErr(403, fmt.Sprintf("%s Quota reached", target), nil)
				return nil
			}
			return nil
		})
	}
}
