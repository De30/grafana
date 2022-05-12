package models

import (
	"strings"

	"github.com/armon/go-radix"
)

/*
# Cases to cover
* Match optional scopes for certain action - DONE
* Scopes for sql filter
*/

const (
	noSuffix       = ""
	wildcardSuffix = "*"
)

type WalkFn func(scope string, value interface{}) bool

type UserPermissions interface {
	// Actions return all actions user has
	Actions() map[string]bool
	// Match
	Match(action string, scopes ...string) bool
}

var _ UserPermissions = new(UserPermissionsTrie)

// UserPermissionsTrie implement UserPermissions by storing permissions using prefix trie
type UserPermissionsTrie struct {
	// trees is a map of scopes represented by a radix tree for fast lookup
	// they are constructed only when needed and cached for the duration of the request
	trees       map[string]*radix.Tree
	permissions map[string][]string
}

func (u *UserPermissionsTrie) Actions() map[string]bool {
	actions := make(map[string]bool, len(u.permissions))
	for action := range u.permissions {
		actions[action] = true
	}
	return actions
}

func (u *UserPermissionsTrie) Match(action string, scopes ...string) bool {
	tree, ok := u.tree(action)
	if !ok {
		return false
	}
	for _, scope := range scopes {
		var matches bool
		tree.Walk(func(s string, v interface{}) bool {
			suffix := v.(string)
			if suffix == wildcardSuffix {
				matches = true
				return true
			}
			matches = s == scope
			return matches
		})
		if matches {
			return true
		}
	}
	return false
}

func matchTree(tree *radix.Tree, action string, scopes ...string) bool {
	for _, scope := range scopes {
		var matches bool
		tree.Walk(func(s string, v interface{}) bool {
			suffix := v.(string)
			if suffix == wildcardSuffix {
				matches = true
				return true
			}
			matches = s == scope
			return matches
		})
		if matches {
			return true
		}
	}
	return false
}

func matchSlice(slice []string, action string, scopes ...string) bool {
	for _, target := range scopes {
		for _, scope := range slice {
			if scope == "" {
				continue
			}

			prefix, last := scope[:len(scope)-1], scope[len(scope)-1]
			if last == '*' {
				if strings.HasPrefix(target, prefix) {
					return true
				}
			}

			if scope == target {
				return true
			}
		}
	}

	return false
}

func (u *UserPermissionsTrie) tree(action string) (*radix.Tree, bool) {
	tree, ok := u.trees[action]
	if ok {
		return tree, true
	}

	scopes, ok := u.permissions[action]
	if !ok {
		return nil, false
	}

	tree = radix.New()
	for _, scope := range scopes {
		if strings.HasSuffix(scope, wildcardSuffix) {
			// need to remove the wildcard suffix in order for the scope to match path of descendant scopes
			tree.Insert(strings.TrimSuffix(scope, wildcardSuffix), true)
		} else {
			tree.Insert(scope, false)
		}
	}

	// cache the tree
	u.trees[action] = tree
	return tree, true
}
