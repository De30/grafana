package plugins

import (
	"context"
	"net"
	"testing"

	"github.com/stretchr/testify/require"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/test/bufconn"

	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	acmock "github.com/grafana/grafana/pkg/services/accesscontrol/mock"
	"github.com/grafana/grafana/pkg/setting"
)

const bufSize = 1024 * 1024

func lis() *bufconn.Listener {
	return bufconn.Listen(bufSize)
}

func setupTest(t *testing.T, ctx context.Context, mock *acmock.Mock) (AccessControlServer, AccessControlClient) {
	listener := lis()
	server, errProvide := ProvideAccessControlServer(listener, mock, &setting.Cfg{StaticRootPath: "./"})
	require.NoError(t, errProvide)

	bufDialer := func(ctx context.Context, s string) (net.Conn, error) { return listener.Dial() }
	conn, errDial := grpc.DialContext(ctx, "bufnet", grpc.WithContextDialer(bufDialer), grpc.WithTransportCredentials(insecure.NewCredentials()))
	require.NoError(t, errDial)

	client := NewAccessControlClient(conn)
	t.Cleanup(func() {
		conn.Close()
	})

	return server, client
}

func TestServerImpl_IsDisabled(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name    string
		want    bool
		wantErr bool
	}{
		{
			name:    "Disabled accesscontrol",
			want:    true,
			wantErr: false,
		},
		{
			name:    "Enabled accesscontrol",
			want:    false,
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := acmock.New()
			mock.IsDisabledFunc = func() bool {
				return tt.want
			}
			_, client := setupTest(t, ctx, mock)

			resp, errIsDisabled := client.IsDisabled(ctx, &Void{})
			if tt.wantErr {
				require.Error(t, errIsDisabled)
				return
			}
			require.NoError(t, errIsDisabled)

			isDisabled := resp.IsDisabled
			require.Equal(t, tt.want, isDisabled)
		})
	}
}

func TestServerImpl_RegisterPluginRoles(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name    string
		want    []*RoleRegistration
		wantErr bool
	}{
		{
			name: "Register a role",
			want: []*RoleRegistration{
				{
					Role: &Role{
						Name:        "plugins:enterprise.logs:reader",
						Version:     1,
						DisplayName: "Enterprise Logs Reader",
						Group:       "Plugins",
						Description: "See enterprise logs App plugin",
						Hidden:      false,
						Permissions: []*Permission{
							{Action: "grafana-enterprise-logs-app.tenants:read"},
							{Action: "grafana-enterprise-logs-app.accesspolicy:read"},
							{Action: "grafana-enterprise-logs-app.ringhealth:read"},
							{Action: "grafana-enterprise-logs-app.licenses:read"},
							{Action: "grafana-enterprise-logs-app.settings:read"},
						},
					},
					Grants: []string{string(models.ROLE_ADMIN)},
				},
				{
					Role: &Role{
						Name:        "plugins:enterprise.logs:writer",
						Version:     1,
						DisplayName: "Enterprise Logs Writer",
						Group:       "Plugins",
						Description: "Manage enterprise logs App plugin",
						Hidden:      false,
						Permissions: []*Permission{
							{Action: "grafana-enterprise-logs-app.tenants:read"},
							{Action: "grafana-enterprise-logs-app.tenants:write"},
							{Action: "grafana-enterprise-logs-app.accesspolicy:read"},
							{Action: "grafana-enterprise-logs-app.accesspolicy:write"},
							{Action: "grafana-enterprise-logs-app.ringhealth:read"},
							{Action: "grafana-enterprise-logs-app.licenses:read"},
							{Action: "grafana-enterprise-logs-app.settings:read"},
							{Action: "grafana-enterprise-logs-app.settings:write"},
						},
					},
					Grants: []string{string(models.ROLE_ADMIN)},
				},
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := acmock.New()
			_, client := setupTest(t, ctx, mock)

			request := &RegisterPluginRolesRequest{Registrations: tt.want}
			resp, errIsDisabled := client.RegisterPluginRoles(ctx, request)
			require.NoError(t, errIsDisabled)

			errRequest := resp.GetError()
			if tt.wantErr {
				require.NotNil(t, errRequest)
				require.NotEmpty(t, errRequest.Error)
				return
			}
			require.Nil(t, errRequest)

			require.Len(t, mock.Calls.DeclareFixedRoles, 1)
			registrations, _ := mock.Calls.DeclareFixedRoles[0].([]interface{})
			require.Len(t, registrations[0], len(tt.want))
			for _, wantReg := range tt.want {
				require.Contains(t, registrations[0], wantReg.toRoleRegistration())
			}
		})
	}
}

func TestServerImpl_HasAccess(t *testing.T) {
	ctx := context.Background()
	tests := []struct {
		name        string
		user        User
		ev          Evaluator
		permissions []*ac.Permission
		want        bool
		wantErr     bool
	}{
		{
			name: "Does not have access",
			user: User{
				ID:    1,
				OrgID: 2,
			},
			ev:          Evaluator{Ev: (&PermissionEvaluator{Action: "teams:read", Scope: []string{"teams:id:1"}}).toAny(t)},
			permissions: []*ac.Permission{},
			want:        false,
			wantErr:     false,
		},
		{
			name: "Has access",
			user: User{
				ID:    1,
				OrgID: 2,
			},
			ev:          Evaluator{Ev: (&PermissionEvaluator{Action: "teams:read", Scope: []string{"teams:id:1"}}).toAny(t)},
			permissions: []*ac.Permission{{Action: "teams:read", Scope: "teams:*"}},
			want:        true,
			wantErr:     false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mock := acmock.New()
			mock.GetUserPermissionsFunc = func(ctx context.Context, siu *models.SignedInUser, o ac.Options) ([]*ac.Permission, error) {
				return tt.permissions, nil
			}
			_, client := setupTest(t, ctx, mock)

			resp, errHasAccess := client.HasAccess(ctx, &HasAccessRequest{User: &tt.user, Evaluator: &tt.ev})
			if tt.wantErr {
				require.Error(t, errHasAccess)
				return
			}
			require.NoError(t, errHasAccess)

			hasAccess := resp.HasAccess
			require.Equal(t, tt.want, hasAccess)
		})
	}
}
