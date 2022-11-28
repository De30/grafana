package api

import (
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
)

type HistoryApiHandler struct {
}

func NewHistoryApi() *HistoryApiHandler {
	return &HistoryApiHandler{}
}

func (f *HistoryApiHandler) handleRouteGetStateHistory(ctx *models.ReqContext) response.Response {
	return nil
}

func (f *HistoryApiHandler) handleRouteGetRuleStateHistory(ctx *models.ReqContext) response.Response {
	return nil
}
