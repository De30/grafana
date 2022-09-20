package object

// RawObject is the base byte[] with basic storage metadata
type RawObject struct {
	Path    string // UID+kind :)  include org in the prefix
	Size    int64  // Content-Length
	Created int64  // timestamp
	Updated int64  // timestamp  Last-Modified

	CreatedBy int64 // user_id
	UpdatedBy int64 // user_id

	ETag string // MD5 digest of the Body

	// The raw body most likely JSON, but may be image etc
	Body []byte

	// Not in every object store, but might be
	SyncTime    int64  // when was the object synced from external source
	SaveMessage string // the commit message when this was saved
	Version     string // commit hash?
}

// Extracted from the raw object
type ObjectSummary struct {
	Name        string
	Description string
	Labels      map[string]string // tags can be represented as keys with no value

	// Optional values -- naming convention for types?
	Fields map[string]interface{} // Saved as JSON, returned in results, but values not sortable

	// Optional references to external things
	References []ExternalReference
}

type ExternalReference struct {
	Kind string // datasource / panel
	Type string // prometheus / heatmap
	UID  string // path
}

// Values we can calculate based on the whole system and my update periodically
type DynamicObjectData struct {
	Info   map[string]interface{} // Key value pairs that update independent of the object body
	Labels map[string]string      // tags can be represented as keys with no value
}
