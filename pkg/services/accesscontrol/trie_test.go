package accesscontrol

import (
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestTrie(t *testing.T) {
	t.Run("should insert one value", func(t *testing.T) {
		trie := NewTrie()
		trie.Insert("dashboards:id:100")
		trie.Insert("dashboards:id:10")
		trie.Insert("dashboards:uid:10")
		trie.Insert("dashboards")
		trie.Insert("folder:id:1")
		trie.Insert("folder:id:121")
		// Root should no longer be a leaf
		assert.False(t, trie.nodes[0].isLeaf)
		trie.WalkPath("dashboards:id:100", func(key string) {
			fmt.Println("Node: ", key)
		})
	})

}
