package api

import (
	"fmt"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
)

func (hs *HTTPServer) createQueryHistory(c *models.ReqContext, cmd dtos.QueryHistory) response.Response {
	hs.log.Debug("Received request to add query to query history", "query", cmd.Queries, "datasource", cmd.DataSourceUid)

	queryHistory, err := hs.QueryHistoryService.CreateQueryHistory(c.Req.Context(), c.SignedInUser, cmd.Queries, cmd.DataSourceUid)
	if err != nil {
		return response.Error(500, "Failed to create query history", err)
	}

	return response.JSON(200, queryHistory)
}

func (hs *HTTPServer) getQueryHistory(c *models.ReqContext, cmd dtos.GetQueryHistory) response.Response {
	hs.log.Debug("Received request to add query to query history", "datasource", cmd.DataSourceUid)

	queryHistory, err := hs.QueryHistoryService.GetQueryHistory(c.Req.Context(), c.SignedInUser, cmd.DataSourceUid)
	if err != nil {
		return response.Error(500, "Failed to get query history", err)
	} else {
		fmt.Println("=======OOK========")
	}

	return response.JSON(200, queryHistory)
}
