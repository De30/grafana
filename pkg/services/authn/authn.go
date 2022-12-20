package authn

import (
	"context"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
)

const (
	ClientAPIKey    = "auth.client.api-key" // #nosec G101
	ClientAnonymous = "auth.client.anonymous"
)

type Service interface {
	// Authenticate is used to authenticate using a specific client
	Authenticate(ctx context.Context, client string, r *Request) (*Identity, bool, error)
}

type Client interface {
	// Authenticate performs the authentication for the request
	Authenticate(ctx context.Context, r *Request) (*Identity, error)
	// Test should return true if client can be used to authenticate request
	Test(ctx context.Context, r *Request) bool
}

type Request struct {
	HTTPRequest *http.Request
}

const (
	APIKeyIDPrefix         = "api-key:"
	ServiceAccountIDPrefix = "service-account:"
)

type Identity struct {
	ID             string
	OrgID          int64
	OrgCount       int
	OrgName        string
	OrgRoles       map[int64]org.RoleType
	Login          string
	Name           string
	Email          string
	AuthID         string
	AuthModule     string
	IsGrafanaAdmin bool
	IsDisabled     bool
	HelpFlags1     user.HelpFlags1
	LastSeenAt     time.Time
	Teams          []int64
}

func (i *Identity) Role() org.RoleType {
	return i.OrgRoles[i.OrgID]
}

// IsAnonymous will return true if no ID is set on the identity
func (i *Identity) IsAnonymous() bool {
	return i.ID == ""
}

// SignedInUser is used to translate Identity into SignedInUser struct
func (i *Identity) SignedInUser() *user.SignedInUser {
	u := &user.SignedInUser{
		UserID:             0,
		OrgID:              i.OrgID,
		OrgName:            i.OrgName,
		OrgRole:            i.Role(),
		ExternalAuthModule: i.AuthModule,
		ExternalAuthID:     i.AuthID,
		Login:              i.Login,
		Name:               i.Name,
		Email:              i.Email,
		OrgCount:           i.OrgCount,
		IsGrafanaAdmin:     i.IsGrafanaAdmin,
		IsAnonymous:        i.IsAnonymous(),
		IsDisabled:         i.IsDisabled,
		HelpFlags1:         i.HelpFlags1,
		LastSeenAt:         i.LastSeenAt,
		Teams:              i.Teams,
	}

	// For now, we need to set different fields of the signed-in user based on the identity "type"
	if strings.HasPrefix(i.ID, APIKeyIDPrefix) {
		id, _ := strconv.ParseInt(strings.TrimPrefix(i.ID, APIKeyIDPrefix), 10, 64)
		u.ApiKeyID = id
	} else if strings.HasPrefix(i.ID, ServiceAccountIDPrefix) {
		id, _ := strconv.ParseInt(strings.TrimPrefix(i.ID, ServiceAccountIDPrefix), 10, 64)
		u.UserID = id
		u.IsServiceAccount = true
	}

	return u
}

func IdentityFromSignedInUser(id string, usr *user.SignedInUser) *Identity {
	return &Identity{
		ID:             id,
		OrgID:          usr.OrgID,
		OrgName:        usr.OrgName,
		OrgRoles:       map[int64]org.RoleType{usr.OrgID: usr.OrgRole},
		Login:          usr.Login,
		Name:           usr.Name,
		Email:          usr.Email,
		OrgCount:       usr.OrgCount,
		IsGrafanaAdmin: usr.IsGrafanaAdmin,
		IsDisabled:     usr.IsDisabled,
		HelpFlags1:     usr.HelpFlags1,
		LastSeenAt:     usr.LastSeenAt,
		Teams:          usr.Teams,
	}
}
