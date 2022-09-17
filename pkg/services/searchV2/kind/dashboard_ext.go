package kind

import (
	"github.com/grafana/grafana-plugin-sdk-go/data"
	"github.com/grafana/grafana-plugin-sdk-go/data/converters"
)

// In enterprise we need additional fields that only depend on the ID, not the body
type dashboardIndexExtender struct{}

var _ KindIndexer = &dashboardIndexExtender{}

const (
	documentFieldStatA = "stat_A"
	documentFieldStatB = "stat_B"
)

func (x *dashboardIndexExtender) GetIndex() KindIndexInfo {
	return KindIndexInfo{
		Name: "dashboard",
		Fields: []IndexField{
			{Name: documentFieldStatA, Type: data.FieldTypeNullableInt64, Converter: converters.Int64ToNullableInt64.Converter},
			{Name: documentFieldStatB, Type: data.FieldTypeNullableInt64, Converter: converters.Int64ToNullableInt64.Converter},
		},
	}
}

func (x *dashboardIndexExtender) Read(doc KindContent) (*KindIndexRow, error) {
	row := &KindIndexRow{
		UID:    doc.UID,
		Values: make(map[string]interface{}),
	}
	row.Values[documentFieldStatA] = int64(len(doc.UID))
	row.Values[documentFieldStatB] = int64(len(doc.UID) - 2)
	return row, nil
}
