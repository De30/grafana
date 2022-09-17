package kind

import (
	"io"
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/grafana/grafana-plugin-sdk-go/experimental"
	"github.com/grafana/grafana/pkg/services/searchV2/dslookup"
	"github.com/stretchr/testify/require"
)

func dsLookup() dslookup.DatasourceLookup {
	return dslookup.CreateDatasourceLookup([]*dslookup.DatasourceQueryResult{
		{
			UID:       "P8045C56BDA891CB2",
			Type:      "cloudwatch",
			Name:      "cloudwatch-name",
			IsDefault: false,
		},
		{
			UID:       "default.uid",
			Type:      "default.type",
			Name:      "default.name",
			IsDefault: true,
		},
	})
}

func TestReadDashboard(t *testing.T) {
	// inputs := []string{
	// 	"check-string-datasource-id",
	// 	"all-panels",
	// 	"panel-graph/graph-shared-tooltips",
	// 	"datasource-variable",
	// 	"default-datasource-variable",
	// 	"empty-datasource-variable",
	// 	"repeated-datasource-variables",
	// 	"string-datasource-variable",
	// 	"datasource-variable-no-curly-braces",
	// 	"all-selected-multi-datasource-variable",
	// 	"all-selected-single-datasource-variable",
	// 	"repeated-datasource-variables-with-default",
	// 	"mixed-datasource-with-variable",
	// 	"special-datasource-types",
	// 	"panels-without-datasources",
	// }

	devdash := "../../../../devenv/dev-dashboards/"

	indexers := []KindIndexer{
		&objectIndex{}, // generic object store metadata
		&dashboardIndexer{lookup: dsLookup()},
		&dashboardIndexExtender{}, // enterrpsie
	}

	builder := toIndexFrameBuilder(
		indexers[0].GetIndex(),
		indexers[1].GetIndex(),
		indexers[2].GetIndex(),
	)

	err := filepath.Walk(devdash,
		func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return err
			}

			if !info.IsDir() && strings.HasSuffix(path, ".json") {
				content := KindContent{
					UID:          path[len("../../../../"):],
					Size:         info.Size(),
					LastModified: info.ModTime(),
					GetBody:      func() (io.Reader, error) { return os.Open(path) },
				}

				// Add all the metdata fields
				for _, indexer := range indexers {
					row, err := indexer.Read(content)
					if err != nil {
						return err
					}

					err = builder.add(row)
					if err != nil {
						return err
					}
				}
			}
			return nil
		})
	require.NoError(t, err)

	for _, frame := range builder.frames() {
		experimental.CheckGoldenJSONFrame(t, "testdata", frame.Name, frame, true)
	}

	// require.Nil(t, indexer)
}
