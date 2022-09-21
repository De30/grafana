package acimpl

import (
	"context"
	"fmt"
	"testing"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
)

func generateCheckerData(b *testing.B, numScopes int) (string, []string, map[string][]string) {
	scopes := make([]string, 0, numScopes)
	permissions := make(map[string][]string, 0)
	action := "dashboards:read"
	for i := 0; i < numScopes; i++ {
		scope := fmt.Sprintf("dashboards:uid:%d", i)
		scopes = append(scopes, scope)
		permissions[action] = append(permissions[action], scope)
	}
	return action, scopes, permissions
}

func benchCheckerCreate(b *testing.B, numScopes int) {
	action, _, permissions := generateCheckerData(b, numScopes)
	ac := ProvideAccessControl(setting.NewCfg())
	u := &user.SignedInUser{OrgID: 1, Permissions: map[int64]map[string][]string{1: permissions}}
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		_ = ac.Checker(context.Background(), u, action)
	}
}

func BenchmarkCheckerCreate_100(b *testing.B)  { benchCheckerCreate(b, 100) }
func BenchmarkCheckerCreate_1000(b *testing.B) { benchCheckerCreate(b, 1000) }

func benchChecker(b *testing.B, numScopes int) {
	action, scopes, permissions := generateCheckerData(b, numScopes)
	ac := ProvideAccessControl(setting.NewCfg())
	u := &user.SignedInUser{OrgID: 1, Permissions: map[int64]map[string][]string{1: permissions}}
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		fn := ac.Checker(context.Background(), u, action)
		for i := range scopes {
			fn(scopes[i])
		}
	}
}

func BenchmarkPermissionChecker_100(b *testing.B)  { benchChecker(b, 100) }
func BenchmarkPermissionChecker_1000(b *testing.B) { benchChecker(b, 1000) }

func benchEvalPermission(b *testing.B, numScopes int) {
	action, scopes, permissions := generateCheckerData(b, numScopes)
	ac := ProvideAccessControl(setting.NewCfg())
	u := &user.SignedInUser{OrgID: 1, Permissions: map[int64]map[string][]string{1: permissions}}
	b.ResetTimer()

	for i := 0; i < b.N; i++ {
		for i := range scopes {
			ac.Evaluate(context.Background(), u, accesscontrol.EvalPermission(action, scopes[i]))
		}
	}
}

func BenchmarkPermissionEval_100(b *testing.B)  { benchEvalPermission(b, 100) }
func BenchmarkPermissionEval_1000(b *testing.B) { benchEvalPermission(b, 1000) }
