package api

import (
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
)

type HistoryApiHandler struct {
	svc *HistorySrv
}

func NewHistoryApi(svc *HistorySrv) *HistoryApiHandler {
	return &HistoryApiHandler{
		svc: svc,
	}
}

func (f *HistoryApiHandler) handleRouteGetStateHistory(ctx *models.ReqContext) response.Response {
	return f.svc.RouteQueryHistory(ctx)
}

func (f *HistoryApiHandler) handleRouteGetRuleStateHistory(ctx *models.ReqContext) response.Response {
	return f.svc.RouteQueryRuleHistory(ctx)
}
