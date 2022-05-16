package accesscontrol

import (
	"fmt"
	"strconv"
	"strings"
	"testing"

	"github.com/armon/go-radix"

	"github.com/grafana/grafana/pkg/util"
)

func benchTrieInsert(b *testing.B, numActions, numScopes int) {
	permissions := genPermission(b, "dashboards", numActions, numScopes)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		for _, scopes := range permissions {
			t := NewTrie()
			for _, s := range scopes {
				t.Insert(s)
			}
		}
	}
}

func benchRadixTrieInsert(b *testing.B, numActions, numScopes int) {
	permissions := genPermission(b, "dashboards", numActions, numScopes)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		for _, scopes := range permissions {
			t := radix.New()
			for _, s := range scopes {
				t.Insert(s, nil)
			}
		}
	}
}

func genPermission(b *testing.B, prefix string, numActions, numScopes int) map[string][]string {
	result := make(map[string][]string, 0)
	scopes := genScopes(b, prefix, numScopes)
	for i := 0; i < numActions; i++ {
		result[fmt.Sprintf("%s:%d", prefix, i)] = scopes
	}

	return result
}

func genScopes(b *testing.B, prefix string, num int) []string {
	b.Helper()
	scopes := make([]string, 0, num-1)
	for i := 0; i < num; i++ {
		scopes = append(scopes, fmt.Sprintf("%s:uid:%s", prefix, util.GenerateShortUID()))
	}
	return scopes
}

func genPathSlice(b *testing.B, num int) []string {
	var slice []string
	for i := 1; i <= num; i++ {
		path := strings.Repeat("0", i-1)
		// 100 branches for every path
		for n := 1; n < 100; n++ {
			slice = append(slice, path+strconv.Itoa(n))
		}
		slice = append(slice, path+"0")
	}
	return slice
}

func BenchmarkTrieInsert_100_100(b *testing.B)       { benchTrieInsert(b, 100, 100) }
func BenchmarkTrieInsert_100_1000(b *testing.B)      { benchTrieInsert(b, 100, 1000) }
func BenchmarkTrieRadixInsert_100_100(b *testing.B)  { benchRadixTrieInsert(b, 100, 100) }
func BenchmarkTrieRadixInsert_100_1000(b *testing.B) { benchRadixTrieInsert(b, 100, 1000) }

func benchTrieWalk(b *testing.B, numScopes int) {
	scopes := genScopes(b, "dashboards", numScopes)
	t := NewTrie()
	for _, s := range scopes {
		t.Insert(s)
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		t.Walk(func(key string) {})
	}
}

func benchRadixTrieWalk(b *testing.B, numScopes int) {
	scopes := genScopes(b, "dashboards", numScopes)
	t := radix.New()
	for _, s := range scopes {
		t.Insert(s, nil)
	}

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		t.Walk(func(s string, v interface{}) bool {
			return false
		})
	}
}

func BenchmarkTrieWalk_100(b *testing.B)        { benchTrieWalk(b, 100) }
func BenchmarkTrieWalk_1000(b *testing.B)       { benchTrieWalk(b, 1000) }
func BenchmarkTrieWalk_10000(b *testing.B)      { benchTrieWalk(b, 10000) }
func BenchmarkTrieRadixWalk_100(b *testing.B)   { benchRadixTrieWalk(b, 100) }
func BenchmarkTrieRadixWalk_1000(b *testing.B)  { benchRadixTrieWalk(b, 1000) }
func BenchmarkTrieRadixWalk_10000(b *testing.B) { benchRadixTrieWalk(b, 10000) }

func benchTrieWalkPath(b *testing.B, numNodes int) {
	paths := genPathSlice(b, numNodes)
	t := NewTrie()
	for _, s := range paths {
		t.Insert(s)
	}

	path := strings.Repeat("0", numNodes)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		t.WalkPath(path, func(key string) {})
	}
}

func benchRadixTrieWalkPath(b *testing.B, numNodes int) {
	paths := genPathSlice(b, numNodes)
	t := radix.New()
	for _, s := range paths {
		t.Insert(s, nil)
	}

	path := strings.Repeat("0", numNodes)

	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		t.WalkPath(path, func(s string, v interface{}) bool {
			return false
		})
	}
}

func BenchmarkTrieWalkPath_100(b *testing.B)       { benchTrieWalkPath(b, 100) }
func BenchmarkTrieWalkPath_1000(b *testing.B)      { benchTrieWalkPath(b, 1000) }
func BenchmarkTrieRadixWalkPath_100(b *testing.B)  { benchRadixTrieWalkPath(b, 100) }
func BenchmarkTrieRadixWalkPath_1000(b *testing.B) { benchRadixTrieWalkPath(b, 1000) }
