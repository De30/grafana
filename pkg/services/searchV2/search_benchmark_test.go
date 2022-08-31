package searchV2

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/store"
	"github.com/stretchr/testify/require"
)

type searchBenchmarkDependencies struct {
	dashboardLoader    dashboardLoader
	folderUIDLookup    folderUIDLookup
	entityEventService store.EntityEventsService
	docExtender        DocumentExtender
}

func initIndex(t *testing.B, deps searchBenchmarkDependencies) (*orgIndex, error) {
	t.Helper()
	index := newSearchIndex(
		deps.dashboardLoader,
		deps.entityEventService,
		deps.docExtender,
		deps.folderUIDLookup,
	)
	testOrgId := int64(0)
	_, err := index.buildOrgIndex(context.Background(), testOrgId)
	return index.perOrgIndex[testOrgId], err
}

func BenchmarkSearch(b *testing.B) {
	dashLoader := &staticDashboardLoader{
		dashboardsDirPath:         "testdata/benchdata/dashboards",
		datasourcesJSONPath:       "testdata/benchdata/datasources-api-response.json",
		searchAPIResponseJSONPath: "testdata/benchdata/search-api-response.json",
		logger:                    log.New("static-dashboard-loader"),
	}

	folderUIDLookup, err := newStaticFolderUIDLookup("testdata/benchdata/search-api-response.json")
	require.Nil(b, err)

	deps := searchBenchmarkDependencies{
		dashboardLoader:    dashLoader,
		folderUIDLookup:    folderUIDLookup,
		entityEventService: &store.MockEntityEventsService{},
		docExtender:        &NoopDocumentExtender{},
	}

	index, err := initIndex(b, deps)
	if err != nil {
		b.Error(err)
	}

	phrases := []string{
		"prometheus",
		"prom",
		"metheus",
		"eu",
	}

	types := []string{
		"wildcard",
		"standard",
		"substring",
	}

	for _, phrase := range phrases {
		for _, t := range types {
			b.Run(fmt.Sprintf("[%s], %s search", phrase, t), searchScenario(index, t, phrase))
		}
	}
}

func searchScenario(index *orgIndex, searchType string, phrase string) func(b *testing.B) {
	return func(b *testing.B) {
		for i := 0; i < b.N; i++ {
			resp := doSearchQuery(
				context.Background(),
				testLogger,
				index,
				testAllowAllFilter,
				DashboardQuery{
					Query: phrase,
					Type:  searchType,
					Limit: 1000,
					Kind: []string{
						string(entityKindDashboard),
						string(entityKindFolder),
						string(entityKindPanel),
					},
				},
				&NoopQueryExtender{},
				"/pfix",
			)
			if resp == nil || len(resp.Frames) == 0 {
				b.Error(errors.New("nil response"))
			}

			rowLength, err := resp.Frames[0].RowLen()
			if rowLength == 0 {
				//b.Error("invalid test, row length = 0")
			}

			if err != nil {
				b.Error(err)
			}
		}

	}
}
