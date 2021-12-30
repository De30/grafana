package api

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/query"
	"github.com/grafana/grafana/pkg/tsdb/legacydata"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

func (hs *HTTPServer) handleQueryMetricsError(err error) *response.NormalResponse {
	if errors.Is(err, models.ErrDataSourceAccessDenied) {
		return response.Error(http.StatusForbidden, "Access denied to data source", err)
	}
	var badQuery *query.ErrBadQuery
	if errors.As(err, &badQuery) {
		return response.Error(http.StatusBadRequest, util.Capitalize(badQuery.Message), err)
	}
	return response.Error(http.StatusInternalServerError, "Query data error", err)
}

// QueryMetricsV2 returns query metrics.
// POST /api/ds/query   DataSource query w/ expressions
func (hs *HTTPServer) QueryMetricsV2(c *models.ReqContext) response.Response {
	reqDTO := dtos.MetricRequest{}
	if err := web.Bind(c.Req, &reqDTO); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	var fetchedQueries []*simplejson.Json
	for _, query := range reqDTO.Queries {
		fmt.Printf("req: %+v\n", query)
		dashboard, rsp := getDashboardHelper(c.Req.Context(), c.OrgId, query.Get("dashboardId").MustInt64(), "")

		if rsp != nil {
			return rsp
		}

		panels := dashboard.Data.Get("panels").MustArray()
		panelId := query.Get("panelId").MustInt64()

		json.NewEncoder(os.Stdout).Encode(panels)

		var panel interface{}
		for _, p := range panels {
			if pId, err := p.(map[string]interface{})["id"].(json.Number).Int64(); err == nil && pId == panelId {
				panel = p
			}
		}

		json.NewEncoder(os.Stdout).Encode(panel)

		for _, q := range panel.(map[string]interface{})["targets"].([]interface{}) {
			fetchedQueries = append(fetchedQueries, simplejson.NewFromAny(q))
		}
	}

	reqDTO.Queries = fetchedQueries

	resp, err := hs.queryDataService.QueryData(c.Req.Context(), c.SignedInUser, c.SkipCache, reqDTO, true)
	if err != nil {
		return hs.handleQueryMetricsError(err)
	}
	return toJsonStreamingResponse(resp)
}

func (hs *HTTPServer) QueryMetricsFromDashboard(c *models.ReqContext) response.Response {
	uid := web.Params(c.Req)[":uid"]
	dashboard, rsp := getDashboardHelper(c.Req.Context(), c.OrgId, 0, uid)
	if rsp != nil {
		return rsp
	}

	panels := dashboard.Data.Get("panels").MustArray()

	reqDTO := dtos.MetricRequest{}
	if err := web.Bind(c.Req, &reqDTO); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	var fetchedQueries []*simplejson.Json
	for _, query := range reqDTO.Queries {
		panelId := query.Get("panelId").MustInt64()

		json.NewEncoder(os.Stdout).Encode(panels)

		var panel interface{}
		for _, p := range panels {
			if pId, err := p.(map[string]interface{})["id"].(json.Number).Int64(); err == nil && pId == panelId {
				panel = p
			}
		}

		json.NewEncoder(os.Stdout).Encode(panel)

		for _, q := range panel.(map[string]interface{})["targets"].([]interface{}) {
			fetchedQueries = append(fetchedQueries, simplejson.NewFromAny(q))
		}
	}

	reqDTO.Queries = fetchedQueries

	resp, err := hs.queryDataService.QueryData(c.Req.Context(), c.SignedInUser, c.SkipCache, reqDTO, true)
	if err != nil {
		return hs.handleQueryMetricsError(err)
	}
	return toJsonStreamingResponse(resp)
}

// QueryMetrics returns query metrics
// POST /api/tsdb/query
//nolint: staticcheck // legacydata.DataResponse deprecated
//nolint: staticcheck // legacydata.DataQueryResult deprecated
func (hs *HTTPServer) QueryMetrics(c *models.ReqContext) response.Response {
	reqDto := dtos.MetricRequest{}
	if err := web.Bind(c.Req, &reqDto); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	sdkResp, err := hs.queryDataService.QueryData(c.Req.Context(), c.SignedInUser, c.SkipCache, reqDto, false)
	if err != nil {
		return hs.handleQueryMetricsError(err)
	}

	legacyResp := legacydata.DataResponse{
		Results: map[string]legacydata.DataQueryResult{},
	}

	for refID, res := range sdkResp.Responses {
		dqr := legacydata.DataQueryResult{
			RefID: refID,
		}

		if res.Error != nil {
			dqr.Error = res.Error
		}

		if res.Frames != nil {
			dqr.Dataframes = legacydata.NewDecodedDataFrames(res.Frames)
		}

		legacyResp.Results[refID] = dqr
	}

	statusCode := http.StatusOK
	for _, res := range legacyResp.Results {
		if res.Error != nil {
			res.ErrorString = res.Error.Error()
			legacyResp.Message = res.ErrorString
			statusCode = http.StatusBadRequest
		}
	}

	return response.JSON(statusCode, &legacyResp)
}

func toJsonStreamingResponse(qdr *backend.QueryDataResponse) response.Response {
	statusCode := http.StatusOK
	for _, res := range qdr.Responses {
		if res.Error != nil {
			statusCode = http.StatusBadRequest
		}
	}

	return response.JSONStreaming(statusCode, qdr)
}
