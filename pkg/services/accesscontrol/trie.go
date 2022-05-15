package accesscontrol

import "strings"

type Trie struct {
	nodes []node
	size  int
}

func NewTrie() *Trie {
	return &Trie{nodes: []node{{}}}
}

// TODO - dont store key
type node struct {
	isLeaf bool
	prefix string
	key    string
	// TODO use map?
	edges map[byte]int
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

type WalkFn = func(n node)

func (t *Trie) Insert(s string) {
	// no root node exists so create it
	if len(t.nodes) == 0 {
		t.nodes = append(t.nodes, node{key: s, isLeaf: true})
		t.size++
		return
	}

	idx := 0
	search := s
	for {
		if len(search) == 0 {
			return
		}

		edgeIndex := t.nodes[idx].getEdge(search[0])
		if edgeIndex == 0 {
			t.insert(idx, node{isLeaf: true, prefix: search, key: s})
			return
		}

		commonPrefix := longestPrefix(search, t.nodes[edgeIndex].prefix)
		if commonPrefix == len(t.nodes[edgeIndex].prefix) {
			idx = edgeIndex
			search = search[commonPrefix:]
			continue
		}

		t.update(idx, edgeIndex, commonPrefix, node{prefix: search[:commonPrefix]})

		childIndex := len(t.nodes) - 1
		search = search[commonPrefix:]
		// check if child match is full key then mark it as leaf and set key
		if len(search) == 0 {
			t.nodes[childIndex].key = s
			t.nodes[childIndex].isLeaf = true
			return
		}

		// add new node to child
		t.insert(childIndex, node{
			key:    s,
			isLeaf: true,
			prefix: search,
		})
		return
	}

}

func (t *Trie) insert(index int, node node) {
	t.size++
	t.nodes = append(t.nodes, node)
	t.nodes[index].setEdge(node.prefix[0], len(t.nodes)-1)
}

func (t *Trie) update(index, oldIndex, commonPrefix int, node node) {
	// create new child node
	t.nodes = append(t.nodes, node)
	t.nodes[index].setEdge(node.prefix[0], len(t.nodes)-1)
	t.size++

	// add edge from new child to old node
	t.nodes[len(t.nodes)-1].setEdge(t.nodes[oldIndex].prefix[commonPrefix], oldIndex)
	// update prefix of old node
	t.nodes[oldIndex].prefix = t.nodes[oldIndex].prefix[commonPrefix:]

}

func (t *Trie) Walk(fn WalkFn) {
	if len(t.nodes) == 0 {
		return
	}
	// start from root
	dfs(t.nodes[0], t.nodes, fn)
}

func (t *Trie) WalkPath(path string, fn WalkFn) {
	if len(t.nodes) == 0 {
		return
	}
	if len(path) == 0 {
		return
	}

	dfsPath(path, t.nodes[0], t.nodes, fn)
}

func dfs(node node, nodes []node, fn WalkFn) {
	if node.isLeaf {
		fn(node)
	}
	for _, index := range node.edges {
		dfs(nodes[index], nodes, fn)
	}
}

func dfsPath(path string, node node, nodes []node, fn WalkFn) {
	if node.isLeaf {
		fn(node)
	}

	if len(path) == 0 {
		return
	}
	// TODO: SOLVE
	e := node.getEdge(path[0])
	if e == 0 {
		return
	}

	if strings.HasPrefix(path, nodes[e].prefix) {
		dfsPath(strings.TrimPrefix(path, nodes[e].prefix), nodes[e], nodes, fn)
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
