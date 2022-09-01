package ossaccesscontrol

import (
	"context"
	"strconv"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/accesscontrol/actest"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
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
			fakeService := actest.FakeService{}
			ac := ProvideAccessControl(setting.NewCfg(), fakeService)

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

func TestAccessControl_MetadataFunc(t *testing.T) {
	type testCase struct {
		desc            string
		user            *user.SignedInUser
		expectedActions []string
		expected        map[string]accesscontrol.Metadata
	}

	tests := []testCase{
		{
			desc: "",
			user: &user.SignedInUser{
				OrgID: 1,
				Permissions: map[int64]map[string][]string{
					1: {
						"dashboards:read":  {"dashboards:uid:1", "dashboards:uid:10", "dashboards:uid:11"},
						"dashboards:write": {"dashboards:uid:1", "dashboards:uid:11"},
						"alert.rules:read": {"folders:uid:101"},
					},
				},
			},
			expected: map[string]accesscontrol.Metadata{
				"1":  accesscontrol.Metadata{"dashboards:read": true, "dashboards:write": true, "alert.rules:read": true},
				"10": accesscontrol.Metadata{"dashboards:read": true},
				"11": accesscontrol.Metadata{"dashboards:read": true, "dashboards:write": true},
			},
		},
	}

	data := generateTestData()
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			fakeService := actest.FakeService{}
			ac := ProvideAccessControl(setting.NewCfg(), fakeService)
			f := ac.Metadata(context.Background(), tt.user, "dashboards:uid", "folders:uid")
			lookup := map[string]accesscontrol.Metadata{}
			for _, d := range data {
				meta := f(d)
				if len(meta) > 0 {
					lookup[d.uid] = meta
				}
			}

			require.Len(t, lookup, len(tt.expected))
			for uid, meta := range tt.expected {
				assert.Equal(t, meta, lookup[uid])
			}
		})
	}
}
