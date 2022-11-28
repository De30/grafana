package api

import (
	"context"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
)

type Historian interface {
	QueryStates(ctx context.Context) (*data.Frame, error)
}

type HistorySrv struct {
	log  log.Logger
	hist Historian
}

func (srv *HistorySrv) RouteQueryHistory(c *models.ReqContext) response.Response {
	results, err := srv.hist.QueryStates(c.Req.Context())
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}
	resp := definitions.StateHistory{
		Results: results,
	}
	return response.JSON(http.StatusOK, resp)
}

func (srv *HistorySrv) RouteQueryRuleHistory(c *models.ReqContext) response.Response {
	return response.Empty(http.StatusInternalServerError)
}
