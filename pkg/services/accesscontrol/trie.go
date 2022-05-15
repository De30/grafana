package accesscontrol

import "strings"

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
	edges  map[byte]int
}

func (n *node) setEdge(label byte, index int) {
	if n.edges == nil {
		n.edges = make(map[byte]int, 1)
	}
	n.edges[label] = index
}

func (n *node) getEdge(label byte) int {
	return n.edges[label]
}

type edge struct {
	label byte // Maybe next char
	idx   int  // index for child node
	str   string
}

type WalkFn = func(key string)

func (t *Trie) Insert(search string) {
	// no root node exists so create it
	if len(t.nodes) == 0 {
		t.nodes = append(t.nodes, node{isLeaf: false})
		t.size++
	}

	idx := 0
	for {
		if len(search) == 0 {
			return
		}

		edgeIndex := t.nodes[idx].getEdge(search[0])
		if edgeIndex == 0 {
			t.addNode(idx, node{isLeaf: true, prefix: search})
			return
		}

		commonPrefix := longestPrefix(search, t.nodes[edgeIndex].prefix)
		if commonPrefix == len(t.nodes[edgeIndex].prefix) {
			idx = edgeIndex
			search = search[commonPrefix:]
			continue
		}

		t.addNode(idx, node{prefix: search[:commonPrefix]})
		childIndex := len(t.nodes) - 1
		// add edge from new child to old node
		t.nodes[childIndex].setEdge(t.nodes[edgeIndex].prefix[commonPrefix], edgeIndex)
		// update prefix of old node
		t.nodes[edgeIndex].prefix = t.nodes[edgeIndex].prefix[commonPrefix:]

		search = search[commonPrefix:]
		// check if child match is full key then mark it as leaf and set key
		if len(search) == 0 {
			t.nodes[childIndex].isLeaf = true
			return
		}

		// add new node to child
		t.addNode(childIndex, node{
			isLeaf: true,
			prefix: search,
		})
		return
	}

}

// addNode ads a new node and creates edge from index to the node
func (t *Trie) addNode(index int, node node) {
	t.size++
	t.nodes = append(t.nodes, node)
	t.nodes[index].setEdge(node.prefix[0], len(t.nodes)-1)
}

func (t *Trie) Walk(fn WalkFn) {
	if len(t.nodes) == 0 {
		return
	}
	// start from root
	walk(t.nodes[0], t.nodes, "", fn)
}

func walk(node node, nodes []node, key string, fn WalkFn) {
	if node.isLeaf {
		key += node.prefix
		fn(key)
	}
	for _, index := range node.edges {
		walk(nodes[index], nodes, key, fn)
	}
}

func (t *Trie) WalkPath(path string, fn WalkFn) {
	if len(t.nodes) == 0 {
		return
	}
	if len(path) == 0 {
		return
	}

	walkPath(path, t.nodes[0], t.nodes, "", fn)
}

func walkPath(path string, node node, nodes []node, key string, fn WalkFn) {
	if node.isLeaf {
		key += node.prefix
		fn(key)
	}

	if len(path) == 0 {
		return
	}

	e := node.getEdge(path[0])
	if e != 0 && strings.HasPrefix(path, nodes[e].prefix) {
		walkPath(strings.TrimPrefix(path, nodes[e].prefix), nodes[e], nodes, key, fn)
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
