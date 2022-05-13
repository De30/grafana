package accesscontrol

type Trie struct {
	nodes []Node
	size  int
}

type Node struct {
	isLeaf bool
	key    string
	edges  []edge
}

type edge struct {
	label rune // Maybe next char
	idx   int  // index for child node
}

func (t *Trie) Insert(s string) {
	// no root node exists so create it
	if len(t.nodes) == 0 {
		t.nodes = append(t.nodes, Node{key: s, isLeaf: true})
		t.size++
		return
	}

}

/*
		a
	  /  \
	bs   t
*/
