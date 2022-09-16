package kind

import (
	"encoding/json"
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

func (x *dashboardIndexer) GetIndex() KindIndexInfo {
	jsonconverter := func(v interface{}) (interface{}, error) {
		out, err := json.Marshal(v)
		if err != nil {
			return nil, err
		}
		return json.RawMessage(out), nil
	}

	return KindIndexInfo{
		Name: "dashboard",
		Fields: []IndexField{
			{Name: documentFieldName, Type: data.FieldTypeString},
			{Name: documentFieldDescription, Type: data.FieldTypeString},
			{Name: documentFieldURL, Type: data.FieldTypeString},
			{Name: documentFieldTag, Type: data.FieldTypeJSON, Converter: jsonconverter},    // string[]
			{Name: documentFieldDSType, Type: data.FieldTypeJSON, Converter: jsonconverter}, // string[] distinct ds types
			{Name: documentFieldDSUID, Type: data.FieldTypeJSON, Converter: jsonconverter},  // string[] distinct ds uids
			{Name: "panel", NestedIndex: &KindIndexInfo{
				Name: "panel",
				Fields: []IndexField{
					{Name: documentFieldName, Type: data.FieldTypeString},
					{Name: documentFieldDescription, Type: data.FieldTypeString},
					{Name: documentFieldURL, Type: data.FieldTypeString},

					// panel specific fields
					{Name: documentFieldPanelType, Type: data.FieldTypeString},
					{Name: documentFieldTransformer, Type: data.FieldTypeJSON, Converter: jsonconverter}, // string[] distinct transformers
					{Name: documentFieldDSType, Type: data.FieldTypeJSON, Converter: jsonconverter},      // string[] distinct ds types
					{Name: documentFieldDSUID, Type: data.FieldTypeJSON, Converter: jsonconverter},       // string[] distinct ds uids
				},
			}},
		},
	}
}

func (x *dashboardIndexer) Index(uid string, stream io.Reader) (*KindIndexRow, error) {
	dash, err := extract.ReadDashboard(stream, x.lookup)
	if err != nil {
		return nil, err
	}

	row := &KindIndexRow{
		UID:    uid,
		Values: make(map[string]interface{}),
	}

	url := fmt.Sprintf("/d/%s/%s", uid, models.SlugifyTitle(dash.Title))
	ds_uids, ds_types := getUnique(dash.Datasource)
	row.Values[documentFieldName] = dash.Title
	row.Values[documentFieldDescription] = dash.Description
	row.Values[documentFieldURL] = url
	row.Values[documentFieldTag] = dash.Tags
	row.Values[documentFieldDSType] = ds_types
	row.Values[documentFieldDSUID] = ds_uids

	panels := make([]*KindIndexRow, 0, len(dash.Panels)+1)
	row.Values["panel"] = panels

	for _, panel := range dash.Panels {
		if panel.Type == "row" {
			continue // for now, we are excluding rows from the search index
		}

		ds_uids, ds_types = getUnique(dash.Datasource)

		prow := &KindIndexRow{
			UID:    uid + "#" + strconv.FormatInt(panel.ID, 10),
			Values: make(map[string]interface{}),
		}
		prow.Values[documentFieldName] = panel.Title
		prow.Values[documentFieldDescription] = panel.Description
		prow.Values[documentFieldURL] = fmt.Sprintf("%s?viewPanel=%d", url, panel.ID)
		prow.Values[documentFieldTransformer] = panel.Transformer
		prow.Values[documentFieldDSType] = ds_types
		prow.Values[documentFieldDSUID] = ds_uids
		panels = append(panels, prow)
	}

	return row, nil
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
