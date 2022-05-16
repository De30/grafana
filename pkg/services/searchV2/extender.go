package searchV2

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/blugelabs/bluge"
	"github.com/blugelabs/bluge/search"
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

type DashboardIndexExtender interface {
	GetDocumentExtender() DocumentExtender
	GetQueryExtender() QueryExtender
}

type DocumentExtender interface {
	// ExtendDocument called for each doc while re-indexing.
	ExtendDocument(entityType EntityKind, internalID int64, doc *bluge.Document) error
}

type QueryExtender interface {
	// ModifyTopN called to modify TopN search request based on DashboardQuery.
	ModifyTopN(query DashboardQuery, indexRequest *bluge.TopNSearch) error
	// BuildSearchResults allows constructing search results to return to user.
	BuildSearchResults(ctx context.Context, reader *bluge.Reader, query DashboardQuery, iterator search.DocumentMatchIterator) (data.Frames, error)
}

func ProvideDashboardIndexExtender() DashboardIndexExtender {
	return &OSSIndexExtender{}
}

type OSSIndexExtender struct{}

func (e *OSSIndexExtender) GetDocumentExtender() DocumentExtender {
	return &OSSDocumentExtender{}
}

func (e *OSSIndexExtender) GetQueryExtender() QueryExtender {
	return &OSSQueryExtender{}
}

type OSSDocumentExtender struct{}

func (e *OSSDocumentExtender) ExtendDocument(entityType EntityKind, internalID int64, doc *bluge.Document) error {
	return nil
}

type OSSQueryExtender struct{}

func (e *OSSQueryExtender) ModifyTopN(query DashboardQuery, indexRequest *bluge.TopNSearch) error {
	return nil
}

func (e OSSQueryExtender) BuildSearchResults(ctx context.Context, reader *bluge.Reader, q DashboardQuery, iterator search.DocumentMatchIterator) (data.Frames, error) {
	var frames data.Frames

	dvfieldNames := []string{"type"}
	sctx := search.NewSearchContext(0, 0)

	// numericFields := map[string]bool{"schemaVersion": true, "panelCount": true}

	fScore := data.NewFieldFromFieldType(data.FieldTypeFloat64, 0)
	fUID := data.NewFieldFromFieldType(data.FieldTypeString, 0)
	fKind := data.NewFieldFromFieldType(data.FieldTypeString, 0)
	fPType := data.NewFieldFromFieldType(data.FieldTypeString, 0)
	fName := data.NewFieldFromFieldType(data.FieldTypeString, 0)
	fURL := data.NewFieldFromFieldType(data.FieldTypeString, 0)
	fLocation := data.NewFieldFromFieldType(data.FieldTypeString, 0)
	fTags := data.NewFieldFromFieldType(data.FieldTypeNullableJSON, 0)
	fDSUIDs := data.NewFieldFromFieldType(data.FieldTypeNullableJSON, 0)
	fExplain := data.NewFieldFromFieldType(data.FieldTypeNullableJSON, 0)

	fScore.Name = "score"
	fUID.Name = "uid"
	fKind.Name = "kind"
	fName.Name = "name"
	fLocation.Name = "location"
	fURL.Name = "url"
	fURL.Config = &data.FieldConfig{
		Links: []data.DataLink{
			{Title: "link", URL: "${__value.text}"},
		},
	}
	fPType.Name = "panel_type"
	fDSUIDs.Name = "ds_uid"
	fTags.Name = "tags"
	fExplain.Name = "explain"

	frame := data.NewFrame("Query results", fScore, fKind, fUID, fName, fPType, fURL, fTags, fDSUIDs, fLocation)
	if q.Explain {
		frame.Fields = append(frame.Fields, fExplain)
	}

	locationItems := make(map[string]bool, 50)

	// iterate through the document matches
	match, err := iterator.Next()
	for err == nil && match != nil {
		err = match.LoadDocumentValues(sctx, dvfieldNames)
		if err != nil {
			continue
		}

		uid := ""
		kind := ""
		ptype := ""
		name := ""
		url := ""
		loc := ""
		var ds_uids []string
		var tags []string

		err = match.VisitStoredFields(func(field string, value []byte) bool {
			// if numericFields[field] {
			// 	num, err2 := bluge.DecodeNumericFloat64(value)
			// 	if err2 != nil {
			// 		vals[field] = num
			// 	}
			// } else {
			// 	vals[field] = string(value)
			// }

			switch field {
			case documentFieldUID:
				uid = string(value)
			case documentFieldKind:
				kind = string(value)
			case documentFieldPanelType:
				ptype = string(value)
			case documentFieldName:
				name = string(value)
			case documentFieldURL:
				url = string(value)
			case documentFieldLocation:
				loc = string(value)
			case documentFieldDSUID:
				ds_uids = append(ds_uids, string(value))
			case documentFieldTag:
				tags = append(tags, string(value))
			}
			return true
		})
		if err != nil {
			return nil, fmt.Errorf("error loading stored fields: %v", err)
		}

		fScore.Append(match.Score)
		fKind.Append(kind)
		fUID.Append(uid)
		fPType.Append(ptype)
		fName.Append(name)
		fURL.Append(url)
		fLocation.Append(loc)

		// set a key for all path parts we return
		if !q.SkipLocation {
			for _, v := range strings.Split(loc, "/") {
				locationItems[v] = true
			}
		}

		if len(tags) > 0 {
			js, _ := json.Marshal(tags)
			jsb := json.RawMessage(js)
			fTags.Append(&jsb)
		} else {
			fTags.Append(nil)
		}

		if len(ds_uids) > 0 {
			js, _ := json.Marshal(ds_uids)
			jsb := json.RawMessage(js)
			fDSUIDs.Append(&jsb)
		} else {
			fDSUIDs.Append(nil)
		}

		if q.Explain {
			if match.Explanation != nil {
				js, _ := json.Marshal(&match.Explanation)
				jsb := json.RawMessage(js)
				fExplain.Append(&jsb)
			} else {
				fExplain.Append(nil)
			}
		}

		// load the next document match
		match, err = iterator.Next()
	}

	// Must call after iterating :)
	aggs := iterator.Aggregations()

	header := &customMeta{
		Count:    aggs.Count(), // Total cound
		MaxScore: aggs.Metric("max_score"),
	}
	if len(locationItems) > 0 && !q.SkipLocation {
		header.Locations = getLocationLookupInfo(ctx, reader, locationItems)
	}

	frame.SetMeta(&data.FrameMeta{
		Type:   "search-results",
		Custom: header,
	})

	for _, t := range q.Facet {
		bbb := aggs.Buckets(t.Field)
		if bbb != nil {
			size := len(bbb)

			fName := data.NewFieldFromFieldType(data.FieldTypeString, size)
			fName.Name = t.Field

			fCount := data.NewFieldFromFieldType(data.FieldTypeUint64, size)
			fCount.Name = "Count"

			for i, v := range bbb {
				fName.Set(i, v.Name())
				fCount.Set(i, v.Count())
			}

			frames = append(frames, data.NewFrame("Facet: "+t.Field, fName, fCount))
		}
	}

	return frames, nil
}
