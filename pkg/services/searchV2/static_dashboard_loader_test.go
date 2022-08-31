package searchV2

import (
	"bytes"
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"

	dsDTO "github.com/grafana/grafana/pkg/api/dtos"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/searchV2/dslookup"
	"github.com/grafana/grafana/pkg/services/searchV2/extract"
	"github.com/stretchr/testify/require"
)

var _ dashboardLoader = (*staticDashboardLoader)(nil)

type staticDashboardLoader struct {
	dashboardsDirPath         string // folder with a file per dashboard, each filename is a dashboard UID
	datasourcesJSONPath       string // JSON with response from `/api/datasources`
	searchAPIResponseJSONPath string // JSON with response from `/api/search`
	logger                    log.Logger
}

func newStaticFolderUIDLookup(searchAPIResponseJSONPath string) (folderUIDLookup, error) {
	searchAPIFile, err := os.ReadFile(searchAPIResponseJSONPath)
	if err != nil {
		return nil, err
	}

	var hitList []*models.Hit
	if err := json.Unmarshal(searchAPIFile, &hitList); err != nil {
		return nil, err
	}

	lookup := make(map[int64]string)
	for _, hit := range hitList {
		if hit.Type != models.DashHitFolder {
			continue
		}

		lookup[hit.ID] = hit.UID
	}

	return func(ctx context.Context, folderId int64) (string, error) {
		uid, _ := lookup[folderId]
		return uid, nil
	}, nil
}

func (s *staticDashboardLoader) LoadDashboards(ctx context.Context, orgID int64, dashboardUID string) ([]dashboard, error) {
	datasourceLookup, err := s.createDsLookup()
	if err != nil {
		s.logger.Error("Failed while creating datasource lookup", "err", err)
		return nil, err
	}

	dashboardMetaLookup, err := s.createDashboardMetaLookup()
	if err != nil {
		s.logger.Error("Failed while creating dashboard meta lookup", "err", err, "dashboardsDir", s.dashboardsDirPath)
		return nil, err
	}

	files, err := os.ReadDir(s.dashboardsDirPath)
	if err != nil {
		s.logger.Error("Failed while reading dashboards dir", "err", err, "dashboardsDir", s.dashboardsDirPath)
		return nil, err
	}

	dashboards := make([]dashboard, 0)
	for _, v := range files {
		if v.IsDir() {
			continue
		}

		uid := strings.TrimSuffix(v.Name(), ".json")
		meta := dashboardMetaLookup.byUid(uid)
		if meta == nil {
			s.logger.Error("No meta found for dashboard", "uid", uid)
			continue
		}

		dashboardDataFilePath := filepath.Join(s.dashboardsDirPath, v.Name())
		data, err := os.ReadFile(dashboardDataFilePath)
		if err != nil {
			s.logger.Error("Failed while creating reading dashboard data file", "err", err, "uid", uid, "path", dashboardDataFilePath)
			return nil, err
		}
		info, err := extract.ReadDashboard(bytes.NewReader(data), datasourceLookup)
		if err != nil {
			s.logger.Warn("Error indexing dashboard data", "error", err, "dashboardId", meta.id, "dashboardSlug", meta.slug, "path", dashboardDataFilePath)
			// But append info anyway for now, since we possibly extracted useful information.
		}

		dashboards = append(dashboards, dashboard{
			id:       meta.id,
			uid:      meta.uid,
			isFolder: meta.isFolder,
			folderID: meta.folderID,
			slug:     meta.slug,
			created:  meta.created,
			updated:  meta.updated,
			info:     info,
		})
	}

	return dashboards, err
}

type dashboardMetaLookup interface {
	byUid(uid string) *dashboard
}

type staticDashboardInfoLookup struct {
	hitByUid map[string]*dashboard
}

func (s *staticDashboardInfoLookup) byUid(uid string) *dashboard {
	hit, _ := s.hitByUid[uid]
	return hit
}

func (s *staticDashboardLoader) createDashboardMetaLookup() (dashboardMetaLookup, error) {
	searchAPIFile, err := os.ReadFile(s.searchAPIResponseJSONPath)
	if err != nil {
		return nil, err
	}

	var hitList []*models.Hit
	if err := json.Unmarshal(searchAPIFile, &hitList); err != nil {
		return nil, err
	}

	lookup := make(map[string]*dashboard)
	for _, hit := range hitList {
		lookup[hit.UID] = &dashboard{
			id:       hit.ID,
			uid:      hit.UID,
			isFolder: hit.Type == models.DashHitFolder,
			folderID: hit.FolderID,
			slug:     hit.Slug,
			created:  time.Now(),
			updated:  time.Now(),
			info:     nil,
		}
	}

	return &staticDashboardInfoLookup{hitByUid: lookup}, nil
}

func (s *staticDashboardLoader) createDsLookup() (dslookup.DatasourceLookup, error) {
	dsFile, err := os.ReadFile(s.datasourcesJSONPath)
	if err != nil {
		return nil, err
	}

	var datasourceListItems []dsDTO.DataSourceListItemDTO
	if err := json.Unmarshal(dsFile, &datasourceListItems); err != nil {
		return nil, err
	}

	dsQueryResult := make([]*dslookup.DatasourceQueryResult, 0)
	for _, dsListItem := range datasourceListItems {
		dsQueryResult = append(dsQueryResult, &dslookup.DatasourceQueryResult{
			UID:       dsListItem.UID,
			Type:      dsListItem.Type,
			Name:      dsListItem.Name,
			IsDefault: dsListItem.IsDefault,
		})
	}

	return dslookup.CreateDatasourceLookup(dsQueryResult), nil
}

func TestStaticDashboardLoader(t *testing.T) {
	loader := &staticDashboardLoader{
		dashboardsDirPath:         "testdata/benchdata/dashboards",
		datasourcesJSONPath:       "testdata/benchdata/datasources-api-response.json",
		searchAPIResponseJSONPath: "testdata/benchdata/search-api-response.json",
		logger:                    log.New("static-dashboard-loader"),
	}

	dash, err := loader.LoadDashboards(context.Background(), 0, "")
	require.Nil(t, err)
	require.Len(t, dash, 587)
}
