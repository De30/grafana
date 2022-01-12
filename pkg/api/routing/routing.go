package routing

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/contexthandler"
)

func Wrap(handler func(c *models.ReqContext) response.Response) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		c := contexthandler.FromContext(r.Context())
		if res := handler(c); res != nil {
			res.WriteTo(c)
		}
	})
}
