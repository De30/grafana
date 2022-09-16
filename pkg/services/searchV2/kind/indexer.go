package kind

import (
	"fmt"
	"io"

	"github.com/grafana/grafana-plugin-sdk-go/data"
)

type KindIndexer interface {
	GetIndex() KindIndexInfo

	// Given an entity, get indexable data
	Index(uid string, stream io.Reader) (*KindIndexRow, error)
}

type KindIndexInfo struct {
	// The name of the kind index, this may be a
	Name string `json:"name,omitempty"`

	// List of fields needed to describe the entity bodies.
	// The field names must be unique, and one must be UID
	Fields []IndexField `json:"fields,omitempty"`
}

type KindIndexRow struct {
	UID string `json:"uid,omitempty"`

	// List values that map to the fields described in info
	Values map[string]interface{} `json:"values,omitempty"`
}

type IndexField struct {
	// Name is the field name
	Name string `json:"name,omitempty"`

	// IsUnique is a hint that values for this field will be unique across the corpus
	IsUnique bool `json:"unique,omitempty"`

	// Type maps to the DataFrame field type
	// currently JSON will be used for anything multi-valued
	Type data.FieldType `json:"type"`

	// Used to map go values to the output type
	Converter data.Converter

	// Config is optional display configuration information for Grafana.  This can include units and description
	Config *data.FieldConfig `json:"config,omitempty"`

	// Support nested indexes (ie, panels in dashboards)
	NestedIndex *KindIndexInfo `json:"nested,omitempty"`
}

type indexBuilderFieldInfo struct {
	idx    int
	conv   data.Converter
	nested *indexBuilder
}

type indexBuilder struct {
	frame  *data.Frame
	field  map[string]*indexBuilderFieldInfo
	nested []string // lookup for the idx that has
}

func toIndexBuilder(kind KindIndexInfo) indexBuilder {
	uid := data.NewFieldFromFieldType(data.FieldTypeString, 0)
	uid.Name = "UID"
	b := indexBuilder{
		frame: data.NewFrame(kind.Name, uid),
		field: make(map[string]*indexBuilderFieldInfo),
	}
	idx := 0
	for _, f := range kind.Fields {
		info := &indexBuilderFieldInfo{
			conv: f.Converter,
		}
		b.field[f.Name] = info

		if f.NestedIndex != nil {
			sub := toIndexBuilder(*f.NestedIndex)
			// TODO? add a colum for parent?
			info.nested = &sub
			continue
		}

		idx += 1
		info.idx = idx
		field := data.NewFieldFromFieldType(f.Type, 0)
		field.Config = f.Config
		field.Name = f.Name
		b.frame.Fields = append(b.frame.Fields, field)
	}
	return b
}

func (b *indexBuilder) append(data *KindIndexRow) error {
	row := b.frame.Fields[0].Len()
	b.frame.Extend(1)
	b.frame.Fields[0].SetConcrete(row, data.UID)

	for k, v := range data.Values {
		field := b.field[k]
		if field == nil {
			return fmt.Errorf("unknown field: " + k)
		}

		// Nested docs (panel in dashboard)
		if field.nested != nil {
			rows, ok := v.([]*KindIndexRow)
			if !ok {
				return fmt.Errorf("expecting rows")
			}
			for _, sub := range rows {
				field.nested.append(sub)
			}
			continue
		}

		f := b.frame.Fields[field.idx]
		if field.conv != nil {
			c, err := field.conv(v)
			if err != nil {
				return err
			}
			f.Set(row, c) // this has the new type
		} else {
			f.Set(row, v)
		}
	}

	return nil
}

func (b *indexBuilder) frames() data.Frames {
	frames := make(data.Frames, 0, 3)
	frames = append(frames, b.frame)
	for _, nested := range b.nested {
		n := b.field[nested]
		frames = append(frames, n.nested.frames()...)
	}
	return frames
}
