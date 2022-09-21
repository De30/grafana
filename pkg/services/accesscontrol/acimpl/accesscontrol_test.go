package acimpl

import (
	"context"
	"strconv"
	"testing"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/stretchr/testify/assert"
)

func TestAccessControl_Evaluate(t *testing.T) {
	type testCase struct {
		desc           string
		user           user.SignedInUser
		evaluator      accesscontrol.Evaluator
		resolverPrefix string
		expected       bool
		expectedErr    error
		resolver       accesscontrol.ScopeAttributeResolver
	}

	tests := []testCase{
		{
			desc: "expect user to have access when correct permission is stored on user",
			user: user.SignedInUser{
				OrgID: 1,
				Permissions: map[int64]map[string][]string{
					1: {accesscontrol.ActionTeamsWrite: {"teams:*"}},
				},
			},
			evaluator: accesscontrol.EvalPermission(accesscontrol.ActionTeamsWrite, "teams:id:1"),
			expected:  true,
		},
		{
			desc: "expect user to not have access without required permissions",
			user: user.SignedInUser{
				OrgID: 1,
				Permissions: map[int64]map[string][]string{
					1: {accesscontrol.ActionTeamsWrite: {"teams:*"}},
				},
			},
			evaluator: accesscontrol.EvalPermission(accesscontrol.ActionOrgUsersWrite, "users:id:1"),
			expected:  false,
		},
		{
			desc: "expect user to have access when resolver translate scope",
			user: user.SignedInUser{
				OrgID: 1,
				Permissions: map[int64]map[string][]string{
					1: {accesscontrol.ActionTeamsWrite: {"another:scope"}},
				},
			},
			evaluator:      accesscontrol.EvalPermission(accesscontrol.ActionTeamsWrite, "teams:id:1"),
			resolverPrefix: "teams:id:",
			resolver: accesscontrol.ScopeAttributeResolverFunc(func(ctx context.Context, orgID int64, scope string) ([]string, error) {
				return []string{"another:scope"}, nil
			}),
			expected: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			ac := ProvideAccessControl(setting.NewCfg())

			if tt.resolver != nil {
				ac.RegisterScopeAttributeResolver(tt.resolverPrefix, tt.resolver)
			}

			hasAccess, err := ac.Evaluate(context.Background(), &tt.user, tt.evaluator)
			assert.Equal(t, tt.expected, hasAccess)
			if tt.expectedErr != nil {
				assert.Equal(t, tt.expectedErr, err)
			} else {
				assert.NoError(t, err)
			}
		})
	}
}

type testData struct {
	uid       string
	folderUid string
}

func (d testData) Scopes() []string {
	return []string{
		"dashboards:uid:" + d.uid,
		"folders:uid:" + d.folderUid,
	}
}

func generateTestData() []testData {
	var data []testData
	for i := 1; i < 100; i++ {
		data = append(data, testData{
			uid:       strconv.Itoa(i),
			folderUid: strconv.Itoa(i + 100),
		})
	}
	return data
}

func TestAccessControl_Checker(t *testing.T) {
	data := generateTestData()
	type testCase struct {
		desc        string
		user        *user.SignedInUser
		expectedLen int
	}
	tests := []testCase{
		{
			desc: "should pass for every entity with wildcard scope for action",
			user: &user.SignedInUser{
				OrgID:       1,
				Permissions: map[int64]map[string][]string{1: {"dashboards:read": {"dashboards:*"}}},
			},
			expectedLen: len(data),
		},
		{
			desc: "should pass for every entity with wildcard scope for action",
			user: &user.SignedInUser{
				OrgID:       1,
				Permissions: map[int64]map[string][]string{1: {"dashboards:read": {"folders:*"}}},
			},
			expectedLen: len(data),
		},
		{
			desc: "should only pass for for 3 scopes",
			user: &user.SignedInUser{
				OrgID:       1,
				Permissions: map[int64]map[string][]string{1: {"dashboards:read": {"dashboards:uid:4", "dashboards:uid:50", "dashboards:uid:99"}}},
			},
			expectedLen: 3,
		},
		{
			desc: "should only pass for for 4 for secondary supported scope",
			user: &user.SignedInUser{
				OrgID:       1,
				Permissions: map[int64]map[string][]string{1: {"dashboards:read": {"folders:uid:104", "folders:uid:150", "folders:uid:154", "folders:uid:199"}}},
			},
			expectedLen: 4,
		},
		{
			desc: "should pass none for missing action",
			user: &user.SignedInUser{
				OrgID:       1,
				Permissions: map[int64]map[string][]string{1: {}},
			},
			expectedLen: 0,
		},
	}
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			ac := ProvideAccessControl(setting.NewCfg())
			check := ac.Checker(context.Background(), tt.user, "dashboards:read")
			numPasses := 0
			for _, d := range data {
				if ok := check(d.Scopes()...); ok {
					numPasses++
				}
			}
			assert.Equal(t, tt.expectedLen, numPasses)
		})
	}
}
