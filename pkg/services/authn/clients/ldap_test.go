package clients

import (
	"context"
	"testing"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/ldap"
	"github.com/grafana/grafana/pkg/services/login"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/stretchr/testify/assert"
)

func TestLDAP_AuthenticatePassword(t *testing.T) {
	type testCase struct {
		desc             string
		username         string
		password         string
		expectedErr      error
		expectedLDAPErr  error
		expectedInfo     *models.ExternalUserInfo
		expectedIdentity *authn.Identity
	}

	tests := []testCase{
		{
			desc:     "should successfully authenticate with correct username and password",
			username: "test",
			password: "test123",
			expectedInfo: &models.ExternalUserInfo{
				AuthModule: login.LDAPAuthModule,
				AuthId:     "123",
				Email:      "test@test.com",
				Login:      "test",
				Name:       "test test",
				Groups:     []string{"1", "2"},
				OrgRoles:   map[int64]org.RoleType{1: org.RoleViewer},
			},
			expectedIdentity: &authn.Identity{
				OrgID:      1,
				OrgRoles:   map[int64]org.RoleType{1: org.RoleViewer},
				Login:      "test",
				Name:       "test test",
				Email:      "test@test.com",
				AuthModule: login.LDAPAuthModule,
				AuthID:     "123",
				Groups:     []string{"1", "2"},
				ClientParams: authn.ClientParams{
					SyncUser:            true,
					SyncTeamMembers:     true,
					AllowSignUp:         false,
					EnableDisabledUsers: true,
				},
				LookUpParams: models.UserLookupParams{
					Email: strPtr("test@test.com"),
					Login: strPtr("test"),
				},
			},
		},
		{
			desc:            "should fail if provided password was incorrect",
			username:        "test",
			password:        "wrong",
			expectedErr:     errInvalidPassword,
			expectedLDAPErr: ldap.ErrInvalidCredentials,
		},
		{
			desc:            "should fail if not found",
			username:        "test",
			password:        "wrong",
			expectedErr:     errIdentityNotFound,
			expectedLDAPErr: ldap.ErrCouldNotFindUser,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			c := &LDAP{cfg: setting.NewCfg(), service: fakeLDAPService{ExpectedInfo: tt.expectedInfo, ExpectedErr: tt.expectedLDAPErr}}

			identity, err := c.AuthenticatePassword(context.Background(), 1, tt.username, tt.password)
			assert.ErrorIs(t, err, tt.expectedErr)
			assert.EqualValues(t, tt.expectedIdentity, identity)
		})
	}
}

func strPtr(s string) *string {
	return &s
}

var _ ldapService = new(fakeLDAPService)

type fakeLDAPService struct {
	ExpectedErr  error
	ExpectedInfo *models.ExternalUserInfo
}

func (f fakeLDAPService) Login(query *models.LoginUserQuery) (*models.ExternalUserInfo, error) {
	return f.ExpectedInfo, f.ExpectedErr
}
