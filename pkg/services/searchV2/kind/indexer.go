package kind

import (
	"io"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

type KindIndexer interface {
	GetIndex() []KindIndexInfo

	// Given an entity, get indexable data
	Index(uid string, stream io.Reader) ([]KindIndexRow, error)
}

// { kind: 'x', uid: 'y', meta:{ a:1, b:2 }}

type KindIndexInfo struct {
	// The name of the kind index, this may be a
	Name string `json:"name,omitempty"`

	// List of fields needed to describe the entity bodies
	Fields []IndexField `json:"fields,omitempty"`
}

type KindIndexRow struct {
	Kind string `json:"kind,omitempty"`

	// List values that map to the fields described in info
	Row []interface{} `json:"row,omitempty"`
}

type IndexField struct {
	// Name is the field name
	Name string `json:"name,omitempty"`

	// IsUnique is a hint that values for this field will be unique across the corpus
	IsUnique bool `json:"unique,omitempty"`

	// Type maps to the DataFrame field type
	// currently JSON will be used for anything multi-valued
	Type data.FieldType `json:"type"`

	// Config is optional display configuration information for Grafana.  This can include units and description
	Config *data.FieldConfig `json:"config,omitempty"`
}

func toDataFrames(kinds []KindIndexInfo) map[string]*data.Frame {
	frames := make(map[string]*data.Frame, len(kinds))
	for _, index := range kinds {
		frame := data.NewFrame(index.Name)
		for _, f := range index.Fields {
			field := data.NewFieldFromFieldType(f.Type, 0)
			field.Config = f.Config
			field.Name = f.Name
			frame.Fields = append(frame.Fields, field)
		}
		frames[index.Name] = frame
	}
	return frames
}
