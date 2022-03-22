package api

import (
	"net/http"
	"time"

	"github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/infra/metrics"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/guardian"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

var client = &http.Client{
	Timeout:   time.Second * 5,
	Transport: &http.Transport{Proxy: http.ProxyFromEnvironment},
}

func GetSharingOptions(c *models.ReqContext) {
	c.JSON(200, util.DynMap{
		"externalSnapshotURL":  setting.ExternalSnapshotUrl,
		"externalSnapshotName": setting.ExternalSnapshotName,
		"externalEnabled":      setting.ExternalEnabled,
	})
}

// POST /api/snapshots
func (hs *HTTPServer) CreateDashboardSnapshot(c *models.ReqContext) response.Response {
	cmd := &models.CreateDashboardSnapshotCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	if err := hs.DashboardsnapshotsService.CreateDashboardSnapshot(c.Req.Context(), cmd); err != nil {
		c.JsonApiErr(500, "Failed to create snapshot", err)
		return nil
	}

	snap := cmd.Result
	url := setting.ToAbsUrl("dashboard/snapshot/" + snap.Key)
	if cmd.ExternalUrl != "" {
		url = snap.ExternalUrl
	}

	c.JSON(200, util.DynMap{
		"key":       snap.Key,
		"deleteKey": snap.DeleteKey,
		"url":       url,
		"deleteUrl": setting.ToAbsUrl("api/snapshots-delete/" + snap.DeleteKey),
		"id":        snap.Id,
	})
	return nil
}

// GET /api/snapshots/:key
func (hs *HTTPServer) GetDashboardSnapshot(c *models.ReqContext) response.Response {
	key := web.Params(c.Req)[":key"]
	if len(key) == 0 {
		return response.Error(404, "Snapshot not found", nil)
	}

	query := &models.GetDashboardSnapshotQuery{Key: key}

	err := hs.DashboardsnapshotsService.GetDashboardSnapshot(c.Req.Context(), query)
	if err != nil {
		return response.Error(500, "Failed to get dashboard snapshot", err)
	}

	snapshot := query.Result

	// expired snapshots should also be removed from db
	if snapshot.Expires.Before(time.Now()) {
		return response.Error(404, "Dashboard snapshot not found", err)
	}

	dto := dtos.DashboardFullWithMeta{
		Dashboard: snapshot.Dashboard,
		Meta: dtos.DashboardMeta{
			Type:       models.DashTypeSnapshot,
			IsSnapshot: true,
			Created:    snapshot.Created,
			Expires:    snapshot.Expires,
		},
	}

	metrics.MApiDashboardSnapshotGet.Inc()

	return response.JSON(200, dto).SetHeader("Cache-Control", "public, max-age=3600")
}

// GET /api/snapshots-delete/:deleteKey
func (hs *HTTPServer) DeleteDashboardSnapshotByDeleteKey(c *models.ReqContext) response.Response {
	key := web.Params(c.Req)[":deleteKey"]
	if len(key) == 0 {
		return response.Error(404, "Snapshot not found", nil)
	}

	query := &models.GetDashboardSnapshotQuery{DeleteKey: key}
	err := hs.DashboardsnapshotsService.GetDashboardSnapshot(c.Req.Context(), query)
	if err != nil {
		return response.Error(500, "Failed to get dashboard snapshot", err)
	}

	cmd := &models.DeleteDashboardSnapshotCommand{DeleteKey: query.Result.DeleteKey}

	if err := hs.DashboardsnapshotsService.DeleteDashboardSnapshot(c.Req.Context(), cmd); err != nil {
		return response.Error(500, "Failed to delete dashboard snapshot", err)
	}

	return response.JSON(200, util.DynMap{
		"message": "Snapshot deleted. It might take an hour before it's cleared from any CDN caches.",
		"id":      query.Result.Id,
	})
}

// DELETE /api/snapshots/:key
func (hs *HTTPServer) DeleteDashboardSnapshot(c *models.ReqContext) response.Response {
	key := web.Params(c.Req)[":key"]
	if len(key) == 0 {
		return response.Error(404, "Snapshot not found", nil)
	}

	query := &models.GetDashboardSnapshotQuery{Key: key}
	err := hs.DashboardsnapshotsService.GetDashboardSnapshot(c.Req.Context(), query)
	if err != nil {
		return response.Error(500, "Failed to get dashboard snapshot", err)
	}
	if query.Result == nil {
		return response.Error(404, "Failed to get dashboard snapshot", nil)
	}

	dashboardID := query.Result.Dashboard.Get("id").MustInt64()

	guardian := guardian.New(c.Req.Context(), dashboardID, c.OrgId, c.SignedInUser)
	canEdit, err := guardian.CanEdit()
	if err != nil {
		return response.Error(500, "Error while checking permissions for snapshot", err)
	}

	if !canEdit && query.Result.UserId != c.SignedInUser.UserId {
		return response.Error(403, "Access denied to this snapshot", nil)
	}

	cmd := &models.DeleteDashboardSnapshotCommand{DeleteKey: query.Result.DeleteKey}
	if err := hs.DashboardsnapshotsService.DeleteDashboardSnapshot(c.Req.Context(), cmd); err != nil {
		return response.Error(500, "Failed to delete dashboard snapshot", err)
	}

	return response.JSON(200, util.DynMap{
		"message": "Snapshot deleted. It might take an hour before it's cleared from any CDN caches.",
		"id":      query.Result.Id,
	})
}

// GET /api/dashboard/snapshots
func (hs *HTTPServer) SearchDashboardSnapshots(c *models.ReqContext) response.Response {
	query := c.Query("query")
	limit := c.QueryInt("limit")

	if limit == 0 {
		limit = 1000
	}

	searchQuery := models.GetDashboardSnapshotsQuery{
		Name:         query,
		Limit:        limit,
		OrgId:        c.OrgId,
		SignedInUser: c.SignedInUser,
	}

	err := hs.DashboardsnapshotsService.SearchDashboardSnapshots(c.Req.Context(), &searchQuery)
	if err != nil {
		return response.Error(500, "Search failed", err)
	}

	dtos := make([]*models.DashboardSnapshotDTO, len(searchQuery.Result))
	for i, snapshot := range searchQuery.Result {
		dtos[i] = &models.DashboardSnapshotDTO{
			Id:          snapshot.Id,
			Name:        snapshot.Name,
			Key:         snapshot.Key,
			OrgId:       snapshot.OrgId,
			UserId:      snapshot.UserId,
			External:    snapshot.External,
			ExternalUrl: snapshot.ExternalUrl,
			Expires:     snapshot.Expires,
			Created:     snapshot.Created,
			Updated:     snapshot.Updated,
		}
	}

	return response.JSON(200, dtos)
}
