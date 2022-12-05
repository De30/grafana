package kindsys

import "github.com/grafana/thema"

// CommonMeta contains the metadata common to all categories of kinds.
type CommonMeta struct {
	Name              string   `json:"name"`
	PluralName        string   `json:"pluralName"`
	MachineName       string   `json:"machineName"`
	PluralMachineName string   `json:"pluralMachineName"`
	LineageIsGroup    bool     `json:"lineageIsGroup"`
	Maturity          Maturity `json:"maturity"`
	MimeType          string   `json:"mimeType"`
	Description       string   `json:"description"`
}

// RawMeta represents the static properties in a #Raw kind declaration that are
// trivially representable with basic Go types.
//
// When a .cue #Raw declaration is loaded through the standard [LoadCoreKind],
// func, it is fully validated and populated according to all rules specified
// in CUE for #Raw kinds.
type RawMeta struct {
	CommonMeta
	Extensions []string `json:"extensions"`
}

func (m RawMeta) _private() {}
func (m RawMeta) Common() CommonMeta {
	return m.CommonMeta
}

// CoreStructuredMeta represents the static properties in the declaration of a
// #CoreStructured kind that are representable with basic Go types. This
// excludes Thema schemas.
//
// When a .cue #CoreStructured declaration is loaded through the standard [LoadCoreKind],
// func, it is fully validated and populated according to all rules specified
// in CUE for #CoreStructured kinds.
type CoreStructuredMeta struct {
	CommonMeta
	CurrentVersion thema.SyntacticVersion `json:"currentVersion"`
}

func (m CoreStructuredMeta) _private() {}
func (m CoreStructuredMeta) Common() CommonMeta {
	return m.CommonMeta
}

// CustomStructuredMeta represents the static properties in the declaration of a
// #CustomStructured kind that are representable with basic Go types. This
// excludes Thema schemas.
type CustomStructuredMeta struct {
	CommonMeta
	CurrentVersion thema.SyntacticVersion `json:"currentVersion"`
}

func (m CustomStructuredMeta) _private() {}
func (m CustomStructuredMeta) Common() CommonMeta {
	return m.CommonMeta
}

// ComposableMeta represents the static properties in the declaration of a
// #Composable kind that are representable with basic Go types. This
// excludes Thema schemas.
type ComposableMeta struct {
	CommonMeta
	CurrentVersion thema.SyntacticVersion `json:"currentVersion"`
}

func (m ComposableMeta) _private() {}
func (m ComposableMeta) Common() CommonMeta {
	return m.CommonMeta
}

// SomeKindMeta is an interface type to abstract over the different kind
// metadata struct types: [RawMeta], [CoreStructuredMeta],
// [CustomStructuredMeta].
//
// It is the traditional interface counterpart to the generic type constraint
// KindMetas.
type SomeKindMeta interface {
	_private()
	Common() CommonMeta
}

// KindMetas is a type parameter that comprises the base possible set of
// kind metadata configurations.
type KindMetas interface {
	RawMeta | CoreStructuredMeta | CustomStructuredMeta | ComposableMeta
}
