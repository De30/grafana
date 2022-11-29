package api

import (
	"context"
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/infra/log"
	gapi "github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/ngalert/api/tooling/definitions"
	"github.com/grafana/grafana/pkg/services/ngalert/models"
)

type Historian interface {
	QueryStates(ctx context.Context, query models.HistoryQuery) (*data.Frame, error)
}

type HistorySrv struct {
	log  log.Logger
	hist Historian
}

func (srv *HistorySrv) RouteQueryHistory(c *gapi.ReqContext) response.Response {
	query := models.HistoryQuery{}
	results, err := srv.hist.QueryStates(c.Req.Context(), query)
	if err != nil {
		return ErrResp(http.StatusInternalServerError, err, "")
	}
	resp := definitions.StateHistory{
		Results: results,
	}
	return response.JSON(http.StatusOK, resp)
}

func (srv *HistorySrv) RouteQueryRuleHistory(c *gapi.ReqContext) response.Response {
	return response.Empty(http.StatusInternalServerError)
}
