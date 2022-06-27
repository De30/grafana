package database

import (
	"context"
	"fmt"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/accesscontrol/resourcepermissions/types"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

type setResourcePermissionTest struct {
	desc              string
	orgID             int64
	binding           accesscontrol.Binding
	actions           []string
	resource          string
	resourceID        string
	resourceAttribute string
	seeds             []types.SetResourcePermissionCommand
}

func TestAccessControlStore_SetUserResourcePermission(t *testing.T) {
	tests := []setResourcePermissionTest{
		{
			desc:              "should set resource permission for user",
			binding:           accesscontrol.UserBinding(1),
			actions:           []string{"datasources:query"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
		},
		{
			desc:              "should remove resource permission for user",
			orgID:             1,
			binding:           accesscontrol.UserBinding(1),
			actions:           []string{},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
			seeds: []types.SetResourcePermissionCommand{
				{
					Actions:    []string{"datasources:query"},
					Resource:   "datasources",
					ResourceID: "1",
				},
			},
		},
		{
			desc:              "should add new resource permission for user",
			orgID:             1,
			binding:           accesscontrol.UserBinding(1),
			actions:           []string{"datasources:query", "datasources:write"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
			seeds: []types.SetResourcePermissionCommand{
				{
					Actions:    []string{"datasources:write"},
					Resource:   "datasources",
					ResourceID: "1",
				},
			},
		},
		{
			desc:              "should add new resource permission for team",
			orgID:             1,
			binding:           accesscontrol.TeamBinding(1),
			actions:           []string{"datasources:query"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
		},
		{
			desc:              "should add new resource permission when others exist",
			orgID:             1,
			binding:           accesscontrol.TeamBinding(1),
			actions:           []string{"datasources:query", "datasources:write"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
			seeds: []types.SetResourcePermissionCommand{
				{
					Actions:           []string{"datasources:query"},
					Resource:          "datasources",
					ResourceID:        "1",
					ResourceAttribute: "uid",
				},
			},
		},
		{
			desc:              "should remove permissions for team",
			orgID:             1,
			binding:           accesscontrol.TeamBinding(1),
			actions:           []string{},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
			seeds: []types.SetResourcePermissionCommand{
				{
					Actions:           []string{"datasources:query"},
					Resource:          "datasources",
					ResourceID:        "1",
					ResourceAttribute: "uid",
				},
			},
		},
		{
			desc:              "should add new resource permission for builtin role",
			orgID:             1,
			binding:           accesscontrol.BuiltInRoleBinding("Viewer"),
			actions:           []string{"datasources:query"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
		},
		{
			desc:              "should add new resource permission when others exist",
			orgID:             1,
			binding:           accesscontrol.BuiltInRoleBinding("Viewer"),
			actions:           []string{"datasources:query", "datasources:write"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
			seeds: []types.SetResourcePermissionCommand{
				{
					Actions:           []string{"datasources:query"},
					Resource:          "datasources",
					ResourceID:        "1",
					ResourceAttribute: "uid",
				},
			},
		},
		{
			desc:              "should remove permissions for builtin role",
			orgID:             1,
			binding:           accesscontrol.BuiltInRoleBinding("Viewer"),
			actions:           []string{},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
			seeds: []types.SetResourcePermissionCommand{
				{
					Actions:           []string{"datasources:query"},
					Resource:          "datasources",
					ResourceID:        "1",
					ResourceAttribute: "uid",
				},
			},
		},
	}

	for _, test := range tests {
		t.Run(test.desc, func(t *testing.T) {
			store, _ := setupTestEnv(t)

			for _, s := range test.seeds {
				_, err := store.SetResourcePermission(context.Background(), test.orgID, test.binding, s, nil)
				require.NoError(t, err)
			}

			added, err := store.SetResourcePermission(context.Background(), test.orgID, test.binding, types.SetResourcePermissionCommand{
				Actions:           test.actions,
				Resource:          test.resource,
				ResourceID:        test.resourceID,
				ResourceAttribute: test.resourceAttribute,
			}, nil)

			require.NoError(t, err)
			if len(test.actions) == 0 {
				assert.Equal(t, accesscontrol.ResourcePermission{}, *added)
			} else {
				assert.Len(t, added.Actions, len(test.actions))
				assert.Equal(t, accesscontrol.Scope(test.resource, test.resourceAttribute, test.resourceID), added.Scope)
			}
		})
	}
}

type setResourcePermissionsTest struct {
	desc              string
	orgID             int64
	resourceAttribute string
	commands          []types.SetResourcePermissionsCommand
}

func TestAccessControlStore_SetResourcePermissions(t *testing.T) {
	tests := []setResourcePermissionsTest{
		{
			desc:              "should set all permissions provided",
			orgID:             1,
			resourceAttribute: "uid",
			commands: []types.SetResourcePermissionsCommand{
				{
					Binding: accesscontrol.UserBinding(1),
					SetResourcePermissionCommand: types.SetResourcePermissionCommand{
						Actions:           []string{"datasources:query"},
						Resource:          "datasources",
						ResourceID:        "1",
						ResourceAttribute: "uid",
					},
				},
				{
					Binding: accesscontrol.TeamBinding(3),
					SetResourcePermissionCommand: types.SetResourcePermissionCommand{
						Actions:           []string{"datasources:query"},
						Resource:          "datasources",
						ResourceID:        "1",
						ResourceAttribute: "uid",
					},
				},
				{
					Binding: accesscontrol.BuiltInRoleBinding("Viewer"),
					SetResourcePermissionCommand: types.SetResourcePermissionCommand{
						Actions:           []string{"datasources:query"},
						Resource:          "datasources",
						ResourceID:        "1",
						ResourceAttribute: "uid",
					},
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			store, _ := setupTestEnv(t)

			permissions, err := store.SetResourcePermissions(context.Background(), tt.orgID, tt.commands, types.ResourceHooks{})
			require.NoError(t, err)

			require.Len(t, permissions, len(tt.commands))
			for i, c := range tt.commands {
				if len(c.Actions) == 0 {
					assert.Equal(t, accesscontrol.ResourcePermission{}, permissions[i])
				} else {
					assert.Len(t, permissions[i].Actions, len(c.Actions))
					/*
						FIXME: Refactor test
						assert.Equal(t, c.TeamID, permissions[i].TeamId)
						assert.Equal(t, c.User.ID, permissions[i].UserId)
						assert.Equal(t, c.BuiltinRole, permissions[i].BuiltInRole)
						assert.Equal(t, accesscontrol.Scope(c.Resource, tt.resourceAttribute, c.ResourceID), permissions[i].Scope)
					*/
				}
			}
		})
	}
}

type getResourcePermissionsTest struct {
	desc              string
	user              *models.SignedInUser
	numUsers          int
	actions           []string
	resource          string
	resourceID        string
	resourceAttribute string
	onlyManaged       bool
}

func TestAccessControlStore_GetResourcePermissions(t *testing.T) {
	tests := []getResourcePermissionsTest{
		{
			desc: "should return permissions for resource id",
			user: &models.SignedInUser{
				OrgId: 1,
				Permissions: map[int64]map[string][]string{
					1: {accesscontrol.ActionOrgUsersRead: {accesscontrol.ScopeUsersAll}},
				}},
			numUsers:          3,
			actions:           []string{"datasources:query"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
		},
		{
			desc: "should return manage permissions for all resource ids",
			user: &models.SignedInUser{
				OrgId: 1,
				Permissions: map[int64]map[string][]string{
					1: {accesscontrol.ActionOrgUsersRead: {accesscontrol.ScopeUsersAll}},
				}},
			numUsers:          3,
			actions:           []string{"datasources:query"},
			resource:          "datasources",
			resourceID:        "1",
			resourceAttribute: "uid",
			onlyManaged:       true,
		},
	}

	for _, test := range tests {
		t.Run(test.desc, func(t *testing.T) {
			store, sql := setupTestEnv(t)

			err := sql.WithDbSession(context.Background(), func(sess *sqlstore.DBSession) error {
				role := &accesscontrol.Role{
					OrgID:   test.user.OrgId,
					UID:     "seeded",
					Name:    "seeded",
					Updated: time.Now(),
					Created: time.Now(),
				}
				_, err := sess.Insert(role)
				require.NoError(t, err)

				permission := &accesscontrol.Permission{
					RoleID:  role.ID,
					Action:  "datasources:query",
					Scope:   "datasources:*",
					Updated: time.Now(),
					Created: time.Now(),
				}
				_, err = sess.Insert(permission)
				require.NoError(t, err)

				builtInRole := &accesscontrol.BuiltinRole{
					RoleID:  role.ID,
					OrgID:   1,
					Role:    "Viewer",
					Updated: time.Now(),
					Created: time.Now(),
				}
				_, err = sess.Insert(builtInRole)
				require.NoError(t, err)

				return nil
			})
			require.NoError(t, err)

			seedResourcePermissions(t, store, sql, test.actions, test.resource, test.resourceID, test.resourceAttribute, test.numUsers)

			permissions, err := store.GetResourcePermissions(context.Background(), test.user.OrgId, types.GetResourcePermissionsQuery{
				User:              test.user,
				Actions:           test.actions,
				Resource:          test.resource,
				ResourceID:        test.resourceID,
				ResourceAttribute: test.resourceAttribute,
				OnlyManaged:       test.onlyManaged,
			})
			require.NoError(t, err)

			expectedLen := test.numUsers
			if !test.onlyManaged {
				expectedLen += 1
			}
			assert.Len(t, permissions, expectedLen)
		})
	}
}

func seedResourcePermissions(t *testing.T, store *AccessControlStore, sql *sqlstore.SQLStore, actions []string, resource, resourceID, resourceAttribute string, numUsers int) {
	t.Helper()
	for i := 0; i < numUsers; i++ {
		org, _ := sql.GetOrgByName("test")

		if org == nil {
			addedOrg, err := sql.CreateOrgWithMember("test", int64(i))
			require.NoError(t, err)
			org = &addedOrg
		}

		u, err := sql.CreateUser(context.Background(), models.CreateUserCommand{
			Login: fmt.Sprintf("user:%s%d", resourceID, i),
			OrgId: org.Id,
		})
		require.NoError(t, err)

		_, err = store.SetResourcePermission(context.Background(), 1, accesscontrol.UserBinding(u.Id), types.SetResourcePermissionCommand{
			Actions:           actions,
			Resource:          resource,
			ResourceID:        resourceID,
			ResourceAttribute: resourceAttribute,
		}, nil)
		require.NoError(t, err)
	}
}
