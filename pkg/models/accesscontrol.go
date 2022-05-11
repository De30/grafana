package models

import "github.com/armon/go-radix"

type UserPermissions interface {
	Scopes(orgID int64, action string) ([]string, bool)
}

var _ UserPermissions = new(UserPermissionsTrie)

// UserPermissionsTrie implement UserPermissions by storing permissions using prefix trie
type UserPermissionsTrie struct {
	trie *radix.Tree
}

func (u UserPermissionsTrie) Scopes(orgID int64, action string) ([]string, bool) {
	panic("implement me")
}

var _ UserPermissions = new(UserPermissionsMap)

// UserPermissionsMap implement UserPermissions by storing permissions using a map
type UserPermissionsMap map[int64]map[string][]string

func (m UserPermissionsMap) Scopes(orgID int64, action string) ([]string, bool) {
	scopes, ok := m[orgID][action]
	return scopes, ok
}
