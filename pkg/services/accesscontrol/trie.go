package accesscontrol

import (
	"strings"
)

type Trie struct {
	nodes []node
	size  int
}

func NewTrie() *Trie {
	return &Trie{nodes: []node{{}}}
}

type node struct {
	isLeaf bool
	prefix string
	key    string
	edges  []edge
}

type edge struct {
	label byte
	index int
}

func (n *node) addEdge(label byte, index int) {
	n.edges = append(n.edges, edge{label, index})
}

func (n *node) updateEdge(label byte, index int) {
	for i, e := range n.edges {
		if e.label == label {
			n.edges[i].index = index
		}
	}
}

func (n *node) getEdge(label byte) int {
	for _, e := range n.edges {
		if e.label == label {
			return e.index
		}
	}
	return 0
}

func (t *Trie) Insert(key string) {
	// no root node exists so create it
	if len(t.nodes) == 0 {
		t.nodes = append(t.nodes, node{isLeaf: false})
		t.size++
	}

	search := key
	idx := 0
	for {
		if len(search) == 0 {
			return
		}

		edgeIndex := t.nodes[idx].getEdge(search[0])
		if edgeIndex == 0 {
			t.addNode(idx, node{isLeaf: true, key: key, prefix: search}, false)
			return
		}

		commonPrefix := longestPrefix(search, t.nodes[edgeIndex].prefix)
		if commonPrefix == len(t.nodes[edgeIndex].prefix) {
			idx = edgeIndex
			search = search[commonPrefix:]
			continue
		}

		t.addNode(idx, node{prefix: search[:commonPrefix]}, true)
		childIndex := len(t.nodes) - 1
		// add edge from new child to old node
		t.nodes[childIndex].addEdge(t.nodes[edgeIndex].prefix[commonPrefix], edgeIndex)
		// update prefix of old node
		t.nodes[edgeIndex].prefix = t.nodes[edgeIndex].prefix[commonPrefix:]

		search = search[commonPrefix:]
		// check if child match is full key then mark it as leaf and set key
		if len(search) == 0 {
			t.nodes[childIndex].key = key
			t.nodes[childIndex].isLeaf = true
			return
		}

		// add new node to child
		t.addNode(childIndex, node{
			isLeaf: true,
			key:    key,
			prefix: search,
		}, false)
		return
	}

}

func (t *Trie) insert(index int, key string, search string) {
	if len(search) == 0 {
		return
	}

	edgeIndex := t.nodes[index].getEdge(search[0])
	if edgeIndex == 0 {
		t.addNode(index, node{isLeaf: true, key: key, prefix: search}, false)
		return
	}

	commonPrefix := longestPrefix(search, t.nodes[edgeIndex].prefix)
	if commonPrefix == len(t.nodes[edgeIndex].prefix) {
		t.insert(edgeIndex, key, search[commonPrefix:])
		return
	}

	t.addNode(index, node{prefix: search[:commonPrefix]}, true)
	childIndex := len(t.nodes) - 1
	// add edge from new child to old node
	t.nodes[childIndex].addEdge(t.nodes[edgeIndex].prefix[commonPrefix], edgeIndex)
	// update prefix of old node
	t.nodes[edgeIndex].prefix = t.nodes[edgeIndex].prefix[commonPrefix:]

	search = search[commonPrefix:]
	// check if child match is full key then mark it as leaf and set key
	if len(search) == 0 {
		t.nodes[childIndex].key = key
		t.nodes[childIndex].isLeaf = true
		return
	}

	// add new node to child
	t.addNode(childIndex, node{
		isLeaf: true,
		key:    key,
		prefix: search,
	}, false)
}

// addNode ads a new node and creates edge from index to the node
func (t *Trie) addNode(index int, node node, update bool) {
	t.size++
	t.nodes = append(t.nodes, node)
	if !update {
		t.nodes[index].addEdge(node.prefix[0], len(t.nodes)-1)
	} else {
		t.nodes[index].updateEdge(node.prefix[0], len(t.nodes)-1)
	}
}

type WalkFn = func(key string)

func (t *Trie) Walk(fn WalkFn) {
	if len(t.nodes) == 0 {
		return
	}
	// start from root
	t.walk(0, fn)
}

func (t *Trie) walk(index int, fn WalkFn) {
	if t.nodes[index].isLeaf {
		fn(t.nodes[index].key)
	}
	for _, e := range t.nodes[index].edges {
		t.walk(e.index, fn)
	}
}

func (t *Trie) WalkPath(path string, fn WalkFn) {
	if len(t.nodes) == 0 {
		return
	}
	if len(path) == 0 {
		return
	}

	t.walkPath(path, 0, fn)
}

func (t *Trie) walkPath(path string, index int, fn WalkFn) {
	if t.nodes[index].isLeaf {
		fn(t.nodes[index].key)
	}

	if len(path) == 0 {
		return
	}

	edge := t.nodes[index].getEdge(path[0])
	if edge != 0 && strings.HasPrefix(path, t.nodes[edge].prefix) {
		t.walkPath(strings.TrimPrefix(path, t.nodes[edge].prefix), edge, fn)
	}
}

func longestPrefix(k1, k2 string) int {
	max := len(k1)
	if l := len(k2); l < max {
		max = l
	}
	var i int
	for i = 0; i < max; i++ {
		if k1[i] != k2[i] {
			break
		}
	}
	return i
}
