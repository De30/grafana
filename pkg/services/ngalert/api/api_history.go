package api

import (
	"net/http"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
)

type HistorySrv struct {
	log log.Logger
}

func (srv *HistorySrv) RouteQueryHistory(c *models.ReqContext) response.Response {
	result := data.NewFrame("states")
	return response.JSON(http.StatusOK, result)
}

func (srv *HistorySrv) RouteQueryRuleHistory(c *models.ReqContext) response.Response {
	return response.Empty(http.StatusInternalServerError)
}
