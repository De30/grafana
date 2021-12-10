package dtos

import (
	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/models"
)

type DsAccess string

type LibraryCredentialDto struct {
	Id               int64            `json:"id"`
	UID              string           `json:"uid"`
	OrgId            int64            `json:"orgId"`
	Name             string           `json:"name"`
	Type             string           `json:"type"`
	JsonData         *simplejson.Json `json:"jsonData,omitempty"`
	SecureJsonFields map[string]bool  `json:"secureJsonFields"`
	ReadOnly         bool             `json:"readOnly"`

	Access            models.DsAccess `json:"access"`
	Url               string          `json:"url"`
	Password          string          `json:"password"`
	User              string          `json:"user"`
	Database          string          `json:"database"`
	BasicAuth         bool            `json:"basicAuth"`
	BasicAuthUser     string          `json:"basicAuthUser"`
	BasicAuthPassword string          `json:"basicAuthPassword"`
	WithCredentials   bool            `json:"withCredentials"`
}
