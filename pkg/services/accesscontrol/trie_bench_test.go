package accesscontrol

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func generatePermissions(b *testing.B, actions, scopes int) ([]Permission, map[string]bool) {
	var permissions []Permission
	ids := make(map[string]bool, scopes)

	for p := 0; p < actions; p++ {
		action := fmt.Sprintf("resources:action%v", p)
		for r := 0; r < scopes; r++ {
			scope := fmt.Sprintf("resources:id:%v", r)
			permissions = append(permissions, Permission{Action: action, Scope: scope})
			ids[scope] = true
		}
	}

	return permissions, ids
}

func benchGetTrieMetadata(b *testing.B, actions, scopes int) {
	permissions, ids := generatePermissions(b, actions, scopes)
	trie := TrieFromPermissions(permissions)
	metas := make(map[string]Metadata)
	b.ResetTimer()

	for n := 0; n < b.N; n++ {
		for id := range ids {
			metas[id] = trie.Metadata(id)
		}
		assert.Len(b, metas, scopes)
		for _, resourceMetadata := range metas {
			assert.Len(b, resourceMetadata, actions)
		}
	}
}

func BenchmarkTrieMetadata_10_1000(b *testing.B)   { benchGetTrieMetadata(b, 10, 1000) }
func BenchmarkTrieMetadata_10_10000(b *testing.B)  { benchGetTrieMetadata(b, 10, 10000) }
func BenchmarkTrieMetadata_10_100000(b *testing.B) { benchGetTrieMetadata(b, 10, 100000) }
func BenchmarkTrieMetadata_10_1000000(b *testing.B) {
	if testing.Short() {
		b.Skip("Skipping benchmark in short mode")
	}
	benchGetTrieMetadata(b, 10, 1000000)
}

func BenchmarkTrieMetadata_1000_10(b *testing.B)   { benchGetTrieMetadata(b, 1000, 10) }
func BenchmarkTrieMetadata_10000_10(b *testing.B)  { benchGetTrieMetadata(b, 10000, 10) }
func BenchmarkTrieMetadata_100000_10(b *testing.B) { benchGetTrieMetadata(b, 100000, 10) }
func BenchmarkTrieMetadata_1000000_10(b *testing.B) {
	if testing.Short() {
		b.Skip("Skipping benchmark in short mode")
	}
	benchGetTrieMetadata(b, 1000000, 10)
}

func benchTrieHasAccess(b *testing.B, actions, scopes int) {
	permissions, _ := generatePermissions(b, actions, scopes)
	t := TrieFromPermissions(permissions)
	b.ResetTimer()

	for n := 0; n < b.N; n++ {
		for i := range permissions {
			require.True(b, t.HasAccess(permissions[i].Action, permissions[i].Scope))
		}
	}
}

func BenchmarkTrieHasAccess_100_100(b *testing.B)   { benchTrieHasAccess(b, 100, 100) }
func BenchmarkTrieHasAccess_100_1000(b *testing.B)  { benchTrieHasAccess(b, 100, 1000) }
func BenchmarkTrieHasAccess_100_10000(b *testing.B) { benchTrieHasAccess(b, 100, 10000) }

func benchBuildTrie(b *testing.B, resourceCount, permissionPerResource int) {
	permissions, _ := generatePermissions(b, resourceCount, permissionPerResource)
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_ = TrieFromPermissions(permissions)
	}
}

func BenchmarkTireBuildTrie_100_100(b *testing.B)   { benchBuildTrie(b, 100, 100) }
func BenchmarkTrieBuildTrie_100_1000(b *testing.B)  { benchBuildTrie(b, 100, 1000) }
func BenchmarkTrieBuildTrie_100_10000(b *testing.B) { benchBuildTrie(b, 100, 10000) }

func benchBuildMap(b *testing.B, actions, scopes int) {
	permissions, _ := generatePermissions(b, actions, scopes)
	b.ResetTimer()
	for n := 0; n < b.N; n++ {
		_ = GroupScopesByAction(permissions)
	}
}

func BenchmarkMapBuild_100_100(b *testing.B)   { benchBuildMap(b, 100, 100) }
func BenchmarkMapBuild_100_1000(b *testing.B)  { benchBuildMap(b, 100, 1000) }
func BenchmarkMapBuild_100_10000(b *testing.B) { benchBuildMap(b, 100, 1000) }
