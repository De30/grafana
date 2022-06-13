package plugins

import (
	"testing"

	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/stretchr/testify/require"
	anypb "google.golang.org/protobuf/types/known/anypb"
)

func Test_toEvaluator(t *testing.T) {
	tests := []struct {
		name    string
		ev      Evaluator
		want    ac.Evaluator
		wantErr bool
	}{
		{
			name:    "Nil evaluator",
			ev:      Evaluator{},
			wantErr: true,
		},
		{
			name:    "Empty evaluator",
			ev:      Evaluator{Ev: &anypb.Any{}},
			wantErr: true,
		},
		{
			name:    "Empty permission evaluator",
			ev:      Evaluator{Ev: (&PermissionEvaluator{}).toAny(t)},
			wantErr: true,
		},
		{
			name:    "Empty All evaluator",
			ev:      Evaluator{Ev: (&AllEvaluator{AllOf: []*anypb.Any{}}).toAny(t)},
			wantErr: true,
		},
		{
			name:    "Empty Any evaluator",
			ev:      Evaluator{Ev: (&AnyEvaluator{AnyOf: []*anypb.Any{}}).toAny(t)},
			wantErr: true,
		},
		{
			name:    "Simple evaluate permissions",
			ev:      Evaluator{Ev: (&PermissionEvaluator{Action: "teams:read", Scope: []string{"teams:id:1"}}).toAny(t)},
			want:    ac.EvalPermission("teams:read", "teams:id:1"),
			wantErr: false,
		},
		{
			name: "Complex permissions",
			ev: Evaluator{Ev: (&AnyEvaluator{
				AnyOf: []*anypb.Any{
					(&PermissionEvaluator{Action: "teams:read", Scope: []string{"teams:id:1"}}).toAny(t),
					(&AllEvaluator{
						AllOf: []*anypb.Any{
							(&PermissionEvaluator{Action: "users:read", Scope: []string{"users:*"}}).toAny(t),
							(&PermissionEvaluator{Action: "org.users:read", Scope: []string{"users:*"}}).toAny(t),
						},
					}).toAny(t),
				}}).toAny(t)},
			want: ac.EvalAny(
				ac.EvalPermission("teams:read", "teams:id:1"),
				ac.EvalAll(
					ac.EvalPermission("users:read", "users:*"),
					ac.EvalPermission("org.users:read", "users:*"),
				),
			),
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			acEv, err := tt.ev.toEvaluator()
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			require.EqualValues(t, tt.want, acEv)
		})
	}
}

func TestRoleRegistration_toRoleRegistration(t *testing.T) {
	tests := []struct {
		name string
		reg  RoleRegistration
		want ac.RoleRegistration
	}{
		{
			name: "Regular registration",
			reg: RoleRegistration{
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
			want: ac.RoleRegistration{
				Role: ac.RoleDTO{

					Name:        "plugins:enterprise.logs:reader",
					Version:     1,
					DisplayName: "Enterprise Logs Reader",
					Group:       "Plugins",
					Description: "See enterprise logs App plugin",
					Hidden:      false,
					Permissions: []ac.Permission{
						{Action: "grafana-enterprise-logs-app.tenants:read"},
						{Action: "grafana-enterprise-logs-app.accesspolicy:read"},
						{Action: "grafana-enterprise-logs-app.ringhealth:read"},
						{Action: "grafana-enterprise-logs-app.licenses:read"},
						{Action: "grafana-enterprise-logs-app.settings:read"},
					},
				},
				Grants: []string{string(models.ROLE_ADMIN)},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			acReg := tt.reg.toRoleRegistration()
			require.EqualValues(t, tt.want, acReg)
		})
	}
}
