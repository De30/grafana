package kind

import (
	"fmt"
	"io"
	"strconv"

	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/searchV2/dslookup"
	"github.com/grafana/grafana/pkg/services/searchV2/extract"
)

type dashboardIndexer struct {
	lookup dslookup.DatasourceLookup
}

var _ KindIndexer = &dashboardIndexer{}

const (
	documentFieldUID         = "_id" // actually UID!! but bluge likes "_id"
	documentFieldKind        = "kind"
	documentFieldTag         = "tag"
	documentFieldURL         = "url"
	documentFieldName        = "name"
	documentFieldDescription = "description"
	documentFieldName_sort   = "name_sort"
	documentFieldName_ngram  = "name_ngram"
	documentFieldLocation    = "location" // parent path
	documentFieldPanelType   = "panel_type"
	documentFieldTransformer = "transformer"
	documentFieldDSUID       = "ds_uid"
	documentFieldDSType      = "ds_type"
	DocumentFieldCreatedAt   = "created_at"
	DocumentFieldUpdatedAt   = "updated_at"
)

type DashboardIndexData struct {
	UID         string   `json:"uid,omitempty"`
	Name        string   `json:"name,omitempty"`
	Description string   `json:"description,omitempty"`
	URL         string   `json:"url,omitempty"`
	Tags        []string `json:"tag,omitempty"` // User entered tags
	DSTypes     []string `json:"ds_type,omitempty"`
	DSUIDs      []string `json:"ds_uid,omitempty"`
}

type DashboardPanelIndexData struct {
	UID          string   `json:"uid,omitempty"`
	Name         string   `json:"name,omitempty"`
	Description  string   `json:"description,omitempty"`
	URL          string   `json:"url,omitempty"`
	PanelType    string   `json:"panel_type,omitempty"`
	Transformers []string `json:"transformer,omitempty"`
	Tags         []string `json:"tag,omitempty"` // User entered tags
	DSTypes      []string `json:"ds_type,omitempty"`
	DSUIDs       []string `json:"ds_uid,omitempty"`
}

type DatasboardIndexRows struct {
	Dashboard DashboardIndexData
	Panels    []DashboardPanelIndexData
}

func (x *dashboardIndexer) GetIndex() []KindIndexInfo {
	return []KindIndexInfo{
		{Name: "dashboard",
			Fields: []IndexField{
				{Name: "UID", Type: data.FieldTypeString},
				{Name: documentFieldName, Type: data.FieldTypeString},
				{Name: documentFieldDescription, Type: data.FieldTypeString},
				{Name: documentFieldURL, Type: data.FieldTypeString},
				{Name: documentFieldTag, Type: data.FieldTypeJSON},    // string[]
				{Name: documentFieldDSType, Type: data.FieldTypeJSON}, // string[] distinct ds types
				{Name: documentFieldDSUID, Type: data.FieldTypeJSON},  // string[] distinct ds uids
			},
		},
		{Name: "dashboard-panel",
			Fields: []IndexField{
				{Name: "UID", Type: data.FieldTypeString},
				{Name: documentFieldName, Type: data.FieldTypeString},
				{Name: documentFieldDescription, Type: data.FieldTypeString},
				{Name: documentFieldURL, Type: data.FieldTypeString},

				// panel specific fields
				{Name: documentFieldPanelType, Type: data.FieldTypeString},
				{Name: documentFieldTransformer, Type: data.FieldTypeJSON}, // string[] distinct transformers
				{Name: documentFieldDSType, Type: data.FieldTypeJSON},      // string[] distinct ds types
				{Name: documentFieldDSUID, Type: data.FieldTypeJSON},       // string[] distinct ds uids
			},
		},
	}
}

func (x *dashboardIndexer) Index(uid string, stream io.Reader) ([]KindIndexRow, error) {
	dash, err := extract.ReadDashboard(stream, x.lookup)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("/d/%s/%s", uid, models.SlugifyTitle(dash.Title))
	ds_uids, ds_types := getUnique(dash.Datasource)
	rows := make([]KindIndexRow, 0, len(dash.Panels)+1)
	rows = append(rows, KindIndexRow{Kind: "dashboard", Row: []interface{}{
		uid,
		dash.Title,
		dash.Description,
		url,
		dash.Tags,
		ds_types,
		ds_uids,
	}})

	for _, panel := range dash.Panels {
		if panel.Type == "row" {
			continue // for now, we are excluding rows from the search index
		}

		ds_uids, ds_types = getUnique(dash.Datasource)
		rows = append(rows, KindIndexRow{Kind: "dashboard-panel", Row: []interface{}{
			uid + "#" + strconv.FormatInt(panel.ID, 10),
			panel.Title,
			panel.Description,
			fmt.Sprintf("%s?viewPanel=%d", url, panel.ID), // URL
			panel.Type,

			panel.Transformer,
			ds_types,
			ds_uids,
		}})
	}

	return rows, nil
}

func getUnique(refs []dslookup.DataSourceRef) ([]string, []string) {
	uidsMap := make(map[string]bool)
	typesMap := make(map[string]bool)
	for _, r := range refs {
		uidsMap[r.UID] = true
		typesMap[r.Type] = true
	}
	uids := make([]string, len(uidsMap))
	types := make([]string, len(typesMap))

	i := 0
	for k := range uidsMap {
		uids[i] = k
		i++
	}

	i = 0
	for k := range typesMap {
		types[i] = k
		i++
	}

	return uids, types
}

// func ReadDashboard(stream io.Reader, lookup dslookup.DatasourceLookup) (*DashboardInfo, error) {

// }
