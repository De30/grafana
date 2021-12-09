package models

import (
	"errors"
	"time"

	"github.com/grafana/grafana/pkg/components/simplejson"
)

var (
	ErrLibraryCredentialNameExists = errors.New("library credential with the same name already exists")
)

type LibraryCredential struct {
	Id             int64             `json:"id"`
	OrgId          int64             `json:"orgId"`
	Uid            string            `json:"uid"`
	Type           string            `json:"type"`
	Name           string            `json:"name"`
	Created        time.Time         `json:"created"`
	Updated        time.Time         `json:"updated"`
	JsonData       *simplejson.Json  `json:"jsonData"`
	SecureJsonData map[string][]byte `json:"secureJsonData"`
	ReadOnly       bool              `json:"readOnly"`

	Access            DsAccess `json:"access"`
	Url               string   `json:"url"`
	Password          string   `json:"password"`
	User              string   `json:"user"`
	Database          string   `json:"database"`
	BasicAuth         bool     `json:"basicAuth"`
	BasicAuthUser     string   `json:"basicAuthUser"`
	BasicAuthPassword string   `json:"basicAuthPassword"`
	WithCredentials   bool     `json:"withCredentials"`
}

// COMMANDS
type AddLibraryCredentialCommand struct {
	Name           string            `json:"name" binding:"Required"`
	Type           string            `json:"type" binding:"Required"`
	JsonData       *simplejson.Json  `json:"jsonData"`
	SecureJsonData map[string]string `json:"secureJsonData"`
	Uid            string            `json:"uid"`

	OrgId                   int64             `json:"-"`
	ReadOnly                bool              `json:"-"`
	EncryptedSecureJsonData map[string][]byte `json:"-"`

	Access            DsAccess `json:"access"`
	Url               string   `json:"url"`
	Password          string   `json:"password"`
	User              string   `json:"user"`
	Database          string   `json:"database"`
	BasicAuth         bool     `json:"basicAuth"`
	BasicAuthUser     string   `json:"basicAuthUser"`
	BasicAuthPassword string   `json:"basicAuthPassword"`
	WithCredentials   bool     `json:"withCredentials"`

	Result *LibraryCredential
}

type UpdateLibraryCredentialCommand struct {
	Id             int64             `json:"id"`
	Name           string            `json:"name" binding:"Required"`
	Type           string            `json:"type" binding:"Required"`
	JsonData       *simplejson.Json  `json:"jsonData"`
	SecureJsonData map[string]string `json:"secureJsonData"`
	Uid            string            `json:"uid"`

	OrgId                   int64             `json:"-"`
	ReadOnly                bool              `json:"-"`
	EncryptedSecureJsonData map[string][]byte `json:"-"`

	Access            DsAccess `json:"access"`
	Url               string   `json:"url"`
	Password          string   `json:"password"`
	User              string   `json:"user"`
	Database          string   `json:"database"`
	BasicAuth         bool     `json:"basicAuth"`
	BasicAuthUser     string   `json:"basicAuthUser"`
	BasicAuthPassword string   `json:"basicAuthPassword"`
	WithCredentials   bool     `json:"withCredentials"`

	Result *LibraryCredential
}

type DeleteLibraryCredentialCommand struct {
	Id int64 `json:"id"`

	OrgId int64 `json:"-"`

	NumDeleted int64
}

// QUERIES
type GetLibraryCredentialsQuery struct {
	OrgId  int64
	Result []*LibraryCredential
}

type GetLibraryCredentialQuery struct {
	Id     int64 `json:"id"`
	OrgId  int64
	Result *LibraryCredential
}
