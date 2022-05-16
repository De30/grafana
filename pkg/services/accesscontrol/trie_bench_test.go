package accesscontrol

import (
	"fmt"
	"testing"

	"github.com/armon/go-radix"

	"github.com/grafana/grafana/pkg/util"
)

func benchTrieInsert(b *testing.B, numScopes int) {
	scopes := genScopes(b, "dashboards", numScopes)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		t := NewTrie()
		for _, s := range scopes {
			t.Insert(s)
		}
	}
}

func benchRadixTrieInsert(b *testing.B, numScopes int) {
	scopes := genScopes(b, "dashboards", numScopes)
	b.ResetTimer()
	b.ReportAllocs()

	for i := 0; i < b.N; i++ {
		t := radix.New()
		for _, s := range scopes {
			t.Insert(s, nil)
		}
	}
}

func genScopes(b *testing.B, prefix string, num int) []string {
	b.Helper()
	scopes := make([]string, 0, num-1)
	for i := 0; i < num; i++ {
		scopes = append(scopes, fmt.Sprintf("%s:uid:%s", prefix, util.GenerateShortUID()))
	}
	return scopes
}

func BenchmarkTrieInsert_100(b *testing.B)      { benchTrieInsert(b, 100) }
func BenchmarkRadixTrieInsert_100(b *testing.B) { benchRadixTrieInsert(b, 100) }
