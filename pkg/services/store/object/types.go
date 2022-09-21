package object

import (
	"context"
	"encoding/json"

	"github.com/grafana/grafana/pkg/models"
)

// All storage + exracted fields together
type FullObject struct {
	models.RawObject
	models.ObjectSummary

	// Only fill the json if requested
	Body json.RawMessage `json:"body,omitempty"`
}

type ObjectQuery struct {
	Paths  []string
	Folder string
	Kind   string
	Labels map[string]string // will match everything
}

type Service interface {
	GetObject(ctx context.Context, path string) *FullObject
}
