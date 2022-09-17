package kind

import (
	"github.com/grafana/grafana-plugin-sdk-go/data"
)

// This is common metadata across all object stores
type objectIndex struct{}

var _ KindIndexer = &objectIndex{}

const (
	documentFieldBytes        = "bytes"
	documentFieldLastModified = "last_modified"
)

func (x *objectIndex) GetIndex() KindIndexInfo {
	return KindIndexInfo{
		Fields: []IndexField{
			{Name: documentFieldBytes, Type: data.FieldTypeInt64, Config: &data.FieldConfig{
				Unit: "bytes",
			}},
			{Name: documentFieldLastModified, Type: data.FieldTypeTime},
		},
	}
}

func (x *objectIndex) Read(doc KindContent) (*KindIndexRow, error) {
	row := &KindIndexRow{
		UID:    doc.UID,
		Values: make(map[string]interface{}),
	}
	row.Values[documentFieldBytes] = doc.Size
	row.Values[documentFieldLastModified] = doc.LastModified
	return row, nil
}
