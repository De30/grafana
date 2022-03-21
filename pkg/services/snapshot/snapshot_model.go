package snapshot

import (
	"fmt"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/util"
	"time"
)

// DashboardSnapshotMetadata contains information about a dashboard
// snapshot suitable for use in lists and search results.
type DashboardSnapshotMetadata struct {
	ID          int64  `json:"id"`
	Name        string `json:"name"`
	Key         string `json:"key"`
	OrgID       int64  `json:"orgId"`
	UserID      int64  `json:"userId"`
	External    bool   `json:"external"`
	ExternalURL string `json:"externalUrl"`

	DeleteKey         string `json:"deleteKey,omitempty"`
	ExternalDeleteURL string `json:"externalDeleteUrl,omitempty"`

	Expires time.Time `json:"expires"`
	Created time.Time `json:"created"`
	Updated time.Time `json:"updated"`
}

// DashboardSnapshot extends the information in
// DashboardSnapshotMetadata with the raw dashboard itself.
type DashboardSnapshot struct {
	DashboardSnapshotMetadata

	Dashboard          map[string]interface{}
	DashboardEncrypted []byte
}

func (s *DashboardSnapshot) Redact() {
	s.DeleteKey = ""
	s.ExternalDeleteURL = ""
}

// DashboardSnapshotList contains a list of metadata related to a
// dashboard snapshot
type DashboardSnapshotList []*DashboardSnapshotMetadata

//swagger:model
type CreateCmd struct {
	// The complete dashboard model.
	// required:true
	Dashboard map[string]interface{} `json:"dashboard" binding:"Required"`
	// Snapshot name
	// required:false
	Name string `json:"name"`
	// When the snapshot should expire in seconds in seconds. Default is never to expire.
	// required:false
	// default:0
	Expires int64 `json:"expires"`

	// these are passed when storing an external snapshot ref
	// Save the snapshot on an external server rather than locally.
	// required:false
	// default: false
	External          bool   `json:"external"`
	ExternalURL       string `json:"-"`
	ExternalDeleteURL string `json:"-"`

	// Define the unique key. Required if `external` is `true`.
	// required:false
	Key string `json:"key"`
	// Unique key used to delete the snapshot. It is different from the `key` so that only the creator can delete the snapshot. Required if `external` is `true`.
	// required:false
	DeleteKey string `json:"deleteKey"`

	OrgID  int64 `json:"-"`
	UserID int64 `json:"-"`

	DashboardEncrypted []byte `json:"-"`
}

func (c CreateCmd) Validate() error {
	if c.Dashboard == nil {
		return fmt.Errorf("dashboard field required")
	}

	if c.External {
		if c.Key == "" {
			return fmt.Errorf("key is required when creating external snapshot")
		}
		if c.DeleteKey == "" {
			return fmt.Errorf("deleteKey is required when creating external snapshot")
		}
	}

	return nil
}

func (c CreateCmd) Skel(now time.Time) (*DashboardSnapshot, error) {
	err := c.Validate()
	if err != nil {
		return nil, err
	}

	var expires time.Time
	if c.Expires != 0 {
		expires = now.Add(time.Duration(c.Expires) * time.Second)
	}

	if c.Name == "" {
		c.Name = "Unnamed snapshot"
	}

	if c.Key == "" {
		c.Key, err = util.GetRandomString(32)
		if err != nil {
			return nil, fmt.Errorf("failed to generate random key: %w", err)
		}
	}

	if c.DeleteKey == "" {
		c.DeleteKey, err = util.GetRandomString(32)
		if err != nil {
			return nil, fmt.Errorf("failed to generate random delete key: %w", err)
		}
	}

	s := DashboardSnapshot{
		DashboardSnapshotMetadata: DashboardSnapshotMetadata{
			ID:                0,
			Name:              c.Name,
			Key:               c.Key,
			OrgID:             c.OrgID,
			UserID:            c.UserID,
			External:          c.External,
			ExternalURL:       c.ExternalURL,
			DeleteKey:         c.DeleteKey,
			ExternalDeleteURL: c.ExternalDeleteURL,
			Expires:           expires,
			Created:           now,
			Updated:           now,
		},
		Dashboard:          c.Dashboard,
		DashboardEncrypted: c.DashboardEncrypted,
	}

	return &s, nil
}

type DeleteCmd struct {
	DeleteKey string
}

type CreateResult struct {
	// Unique key
	Key string `json:"key"`
	// Unique key used to delete the snapshot. It is different from the
	// key so that only the creator can delete the snapshot.
	DeleteKey string `json:"deleteKey"`
	URL       string `json:"url"`
	DeleteURL string `json:"deleteUrl"`
	// Snapshot id
	ID int64 `json:"id"`
}

type DeleteExpiredResult struct {
	DeletedRows int64
}

type GetByKeyQuery struct {
	Key       string
	DeleteKey string

	SignedInUser *models.SignedInUser
}

type GetResult struct {
	Snapshot *DashboardSnapshot
}

type ListQuery struct {
	Name         string
	Limit        int
	OrgID        int64
	SignedInUser *models.SignedInUser
}

type ListResult struct {
	DashboardSnapshots DashboardSnapshotList
}
