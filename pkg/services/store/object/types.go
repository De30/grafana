package object

// RawObject is the base byte[] with basic storage metadata
type RawObject struct {
	Path        string `json:"path"`        // UID+kind :)  include org in the prefix
	ContentType string `json:"contentType"` // content type, kind?

	// Who saved it when
	Created   int64 `json:"created,omitempty"`   // timestamp
	Updated   int64 `json:"updated,omitempty"`   // timestamp  Last-Modified
	CreatedBy int64 `json:"createdBy,omitempty"` // user_id
	UpdatedBy int64 `json:"updatedBy,omitempty"` // user_id

	// Raw body
	Size int64  `json:"size"`           // Content-Length
	ETag string `json:"etag,omitempty"` // MD5 digest of the Body
	Body []byte `json:"-"`              // don't return this as JSON unless explicit

	// ?? most object stores have additional properties -- not sure we need them since we also have object summary?
	Meta map[string]string `json:"meta,omitempty"`

	// Not in every object store, but might be
	SyncTime    int64  `json:"syncTime,omitempty"` // when was the object synced from external source (provisioning or git)
	SaveMessage string `json:"message,omitempty"`  // the commit message when this was saved
	Version     string `json:"version,omitempty"`  // commit hash, incrementing number (as string)
}

// Extracted from the raw object (will not change unless the body does)
type ObjectSummary struct {
	Name        string            `json:"name,omitempty"`
	Description string            `json:"description,omitempty"`
	Labels      map[string]string `json:"labels,omitempty"` // tags can be represented as keys with no value
	URL         string            `json:"URL,omitempty"`    // not great to save here, but maybe not terrible :shrug:

	// Optional values -- naming convention for types?
	Fields map[string]interface{} `json:"fields,omitempty"` // Saved as JSON, returned in results, but values not sortable

	// Will contain panels for panel title search, and similar nested objects
	Nested []NestedObjectSummary `json:"-"` // not intended as JSON response

	// Optional references to external things
	References []ExternalReference `json:"references,omitempty"`
}

type NestedObjectSummary struct {
	UID  string `json:"uid,omitempty"`
	Kind string `json:"kind,omitempty"`

	ObjectSummary
}

type ExternalReference struct {
	Kind string `json:"kind,omitempty"` // datasource / panel
	Type string `json:"type,omitempty"` // prometheus / heatmap
	UID  string `json:"uid,omitempty"`  // path
}

// Values we can calculate based on the whole system and my update periodically
type DynamicObjectData struct {
	Info   map[string]interface{} // Key value pairs that update independent of the object body
	Labels map[string]string      // tags can be represented as keys with no value
}
