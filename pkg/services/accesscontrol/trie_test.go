package accesscontrol

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTrie_HasAccess(t *testing.T) {
	type testCase struct {
		desc        string
		permissions []Permission
		action      string
		scope       string
		expected    bool
	}

	tests := []testCase{
		{
			desc:   "should have access with specific scope",
			action: "users:read",
			scope:  "users:id:1",
			permissions: []Permission{
				{Action: "users:read", Scope: "users:id:1"},
				{Action: "users:read", Scope: "users:id:2"},
			},
			expected: true,
		},
		{
			desc:   "should have access with wildcard scope",
			action: "users:read",
			scope:  "users:id:1",
			permissions: []Permission{
				{Action: "users:read", Scope: "users:*"},
			},
			expected: true,
		},
		{
			desc:   "should not have access when missing action",
			action: "users:write",
			scope:  "users:id:1",
			permissions: []Permission{
				{Action: "users:read", Scope: "users:*"},
			},
			expected: false,
		},
		{
			desc:   "should have access with path based scopes and action on parent",
			action: "dashboards:write",
			scope:  "path:folder/sub/dash",
			permissions: []Permission{
				{Action: "dashboards:write", Scope: "path:folder/*"},
			},
			expected: true,
		},
		{
			desc:   "should not have access with path based scopes with action on child",
			action: "dashboards:write",
			scope:  "path:folder/sub",
			permissions: []Permission{
				{Action: "dashboards:write", Scope: "path:folder/sub/child"},
			},
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			trie := TrieFromPermissions(tt.permissions)
			assert.Equal(t, tt.expected, trie.HasAccess(tt.action, tt.scope))
		})
	}
}

func TestTrie_Scopes(t *testing.T) {
	type testCase struct {
		desc        string
		action      string
		prefix      string
		permissions []Permission
		expectAll   bool
		expected    []string
	}

	tests := []testCase{
		{
			desc:   "should return true for wildcard",
			action: "dashboards:read",
			prefix: "dashboards:uid:",
			permissions: []Permission{
				{Action: "dashboards:write", Scope: "dashboards:uid:111"},
				{Action: "dashboards:read", Scope: "dashboards:uid:222"},
				{Action: "dashboards:read", Scope: "dashboards:*"},
			},
			expectAll: true,
		},
		{
			desc:   "should return all scopes with action",
			action: "dashboards:read",
			prefix: "dashboards:uid:",
			permissions: []Permission{
				{Action: "dashboards:write", Scope: "dashboards:uid:111"},
				{Action: "dashboards:read", Scope: "dashboards:uid:222"},
				{Action: "dashboards:read", Scope: "dashboards:uid:333"},
				{Action: "dashboards:read", Scope: "dashboards:uid:777"},
			},
			expected: []string{
				"dashboards:uid:222",
				"dashboards:uid:333",
				"dashboards:uid:777",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			trie := TrieFromPermissions(tt.permissions)
			scopes, all := trie.Scopes(tt.action, tt.prefix)
			assert.Equal(t, tt.expectAll, all)
			if !tt.expectAll {
				assert.Len(t, scopes, len(tt.expected))
				for _, scope := range scopes {
					assert.Contains(t, tt.expected, scope)
				}
			}
		})
	}
}

func TestTrie_Metadata(t *testing.T) {
	type testCase struct {
		desc        string
		scopes      map[string]bool
		permissions []Permission
		expected    map[string]Metadata
	}

	tests := []testCase{
		{
			desc:     "Should return no permission for resources 1,2,3 given the user has no permission",
			scopes:   map[string]bool{"resources:id:1": true, "resources:id:2": true, "resources:id:3": true},
			expected: map[string]Metadata{},
		},
		{
			desc: "Should return no permission for resources 1,2,3 given the user has permissions for 4 only",
			permissions: []Permission{
				{Action: "resources:action1", Scope: "resources:id:4"},
				{Action: "resources:action2", Scope: "resources:id:4"},
				{Action: "resources:action3", Scope: "resources:id:4"},
			},
			scopes:   map[string]bool{"resources:id:1": true, "resources:id:2": true, "resources:id:3": true},
			expected: map[string]Metadata{},
		},
		{
			desc: "Should only return permissions for resources 1 and 2, given the user has no permissions for 3",
			permissions: []Permission{
				{Action: "resources:action1", Scope: "resources:id:1"},
				{Action: "resources:action2", Scope: "resources:id:2"},
				{Action: "resources:action3", Scope: "resources:id:2"},
			},
			scopes: map[string]bool{"resources:id:1": true, "resources:id:2": true, "resources:id:3": true},
			expected: map[string]Metadata{
				"resources:id:1": {"resources:action1": true},
				"resources:id:2": {"resources:action2": true, "resources:action3": true},
			},
		},
		{
			desc: "Should return permissions with wildcard scopes for resources 1,2,3",
			permissions: []Permission{
				{Action: "resources:action1", Scope: "resources:id:1"},
				{Action: "resources:action2", Scope: "resources:id:2"},
				{Action: "resources:action3", Scope: "resources:id:2"},
				{Action: "resources:action4", Scope: "resources:id:*"},
				{Action: "resources:action5", Scope: "resources:*"},
				{Action: "resources:action6", Scope: "*"},
			},
			scopes: map[string]bool{"resources:id:1": true, "resources:id:2": true, "resources:id:3": true},
			expected: map[string]Metadata{
				"resources:id:1": {"resources:action1": true, "resources:action4": true, "resources:action5": true, "resources:action6": true},
				"resources:id:2": {"resources:action2": true, "resources:action3": true, "resources:action4": true, "resources:action5": true, "resources:action6": true},
				"resources:id:3": {"resources:action4": true, "resources:action5": true, "resources:action6": true},
			},
		},
		{
			desc: "Should correctly filter out irrelevant permissions for resources 1,2,3",
			permissions: []Permission{
				{Action: "resources:action1", Scope: "resources:id:1"},
				{Action: "resources:action2", Scope: "other:id:*"},
				{Action: "other:action1", Scope: "resources:id:1"},
				{Action: "other:action1", Scope: "other:id:1"},
			},
			scopes: map[string]bool{"resources:id:1": true, "resources:id:2": true, "resources:id:3": true},
			expected: map[string]Metadata{
				"resources:id:1": {"resources:action1": true, "other:action1": true},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			trie := TrieFromPermissions(tt.permissions)
			metas := map[string]Metadata{}
			for scope := range tt.scopes {
				meta := trie.Metadata(scope)
				if len(meta) > 0 {
					metas[scope] = meta
				}
			}
			assert.EqualValues(t, tt.expected, metas)
		})
	}
}
