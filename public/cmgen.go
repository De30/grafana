package main

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/ast"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/format"
	cuejson "cuelang.org/go/encoding/json"
	"cuelang.org/go/encoding/openapi"
	"github.com/getkin/kin-openapi/openapi2"
	"github.com/getkin/kin-openapi/openapi2conv"
	ecue "github.com/grafana/thema/encoding/cue"
)

// The set of types that we definitely never want to make into coremodels.
var snever = []string{
	"info",
}

var never = map[string]bool{}

// The set of types that maaaaybe we want to make into coremodels via this
// method, but haven't gotten around to it yet.
var stodo = []string{}

var todo = map[string]bool{}

func init() {
	for _, s := range snever {
		never[s] = true
	}
	for _, s := range stodo {
		todo[s] = true
	}
}

// MAKES SILLY ASSUMPTIONS ABOUT CWD - ONLY `go run` RUN THIS FROM THE DIR IT'S IN
func main() {
	byt, err := ioutil.ReadFile("api-merged.json")
	if err != nil {
		panic(err)
	}

	var doc2 openapi2.T
	if err = json.Unmarshal(byt, &doc2); err != nil {
		panic(err)
	}

	doc3, err := openapi2conv.ToV3(&doc2)
	if err != nil {
		panic(err)
	}

	j3, err := doc3.MarshalJSON()
	if err != nil {
		panic(err)
	}

	ctx := cuecontext.New()
	expr, err := cuejson.Extract("input", j3)
	if err != nil {
		panic(err)
	}
	f := &ast.File{
		Decls: []ast.Decl{expr},
	}

	rt := (*cue.Runtime)(ctx)
	inst, err := rt.CompileFile(f)
	if err != nil {
		panic(err)
	}

	fo, err := openapi.Extract(inst, &openapi.Config{})
	if err != nil {
		panic(err)
	}

	fv := ctx.BuildFile(fo)
	iter, err := fv.Fields(cue.Definitions(true))
	if err != nil {
		panic(err)
	}

	var total, generated int
	skipcounts := make(map[string]int)
	// Empty value, to root the path-filling
	rv := ctx.CompileString(`{}`)
	for iter.Next() {
		total++
		n := strings.TrimPrefix(iter.Selector().String(), "#")
		nlow := strings.ToLower(n)

		iv := iter.Value()
		var reason string
		switch {
		case never[n]:
			reason = fmt.Sprintf("skipping %s: on never blacklist", n)
		case todo[n]:
			reason = fmt.Sprintf("skipping %s: on todo blacklist", n)
		case iv.Kind() != cue.StructKind:
			reason = fmt.Sprintf("skipping %s: not a struct", n)
		case fieldsContainReference(iv):
			reason = fmt.Sprintf("skipping %s: contains a reference", n)
		}
		if reason == "" {
			iter2, err := iv.Fields(cue.All())
			if err != nil {
				panic(fmt.Sprintf("%s: %s", n, err))
			}
			var num int
			for iter2.Next() {
				num++
			}
			if num == 0 {
				reason = fmt.Sprintf("skipping %s: empty struct", n)
			}
		}

		if reason != "" {
			r := strings.Split(reason, ": ")
			skipcounts[r[1]] = skipcounts[r[1]] + 1
			fmt.Println(reason)
			continue
		}

		// Have to fill at a non-ref path in order to keep cue from generating _#defs on
		// fmting a definition value
		p := cue.ParsePath(nlow)
		lrv := rv.FillPath(p, iv)

		// We can skip eval for now because we've already skipped references. Still need proper
		// answer to the reference issue, though.
		// val := lrv.LookupPath(p).Eval()
		val := lrv.LookupPath(p)

		linf, err := ecue.NewLineage(val, nlow, nlow)
		if err != nil {
			panic(fmt.Sprintf("%s: %s", n, err))
		}

		byt, err := format.Node(linf, format.TabIndent(true), format.Simplify())
		if err != nil {
			panic(fmt.Sprintf("%s: %s", n, err))
		}

		err = os.MkdirAll(filepath.Join("..", "pkg", "coremodel", nlow), 0750)
		if err != nil {
			panic(fmt.Sprintf("%s: %s", n, err))
		}
		err = os.WriteFile(filepath.Join("..", "pkg", "coremodel", nlow, "coremodel.cue"), byt, 0664)
		if err != nil {
			panic(fmt.Sprintf("%s: %s", n, err))
		}
		generated++
	}

	fmt.Printf("%v total openapi 3.0 components, %v generated, %v skipped\n", total, generated, total-generated)
	for reason, c := range skipcounts {
		fmt.Println("\t", c, reason)
	}
}

func fieldsContainReference(v cue.Value) bool {
	if !v.Exists() {
		return false
	}
	if isReference(v) {
		return true
	}

	var iter *cue.Iterator
	var err error
	switch v.IncompleteKind() {
	// Simple equality is technically not sufficient b/c Kind is a bitfield, but our
	// types generally aren't complicated enough to have multi-kinded disjuncts, so good enough
	case cue.StructKind:
		if fieldsContainReference(v.LookupPath(cue.MakePath(cue.AnyString))) {
			return true
		}
		iter, err = v.Fields(cue.All())
	case cue.ListKind:
		if fieldsContainReference(v.LookupPath(cue.MakePath(cue.AnyIndex))) {
			return true
		}

		var liter cue.Iterator
		liter, err = v.List()
		iter = &liter
	default:
		return containsReference(v)
	}
	if err != nil {
		panic(err)
	}

	for iter.Next() {
		if fieldsContainReference(iter.Value()) {
			return true
		}
	}
	return false
}

// containsReference recursively flattens expressions within a Value to find all
// its constituent Values, and checks if any of those Values are references.
//
// It does NOT walk struct fields - only expression structures, as returned from Expr().
// Remember that Expr() _always_ drops values in default branches.
func containsReference(v cue.Value) bool {
	if isReference(v) {
		return true
	}
	for _, dv := range flatten(v) {
		if isReference(dv) {
			return true
		}
	}
	return false
}

func isReference(v cue.Value) bool {
	_, path := v.ReferencePath()
	return len(path.Selectors()) > 0
}

func flatten(v cue.Value) []cue.Value {
	all := []cue.Value{v}

	op, dvals := v.Expr()
	defv, has := v.Default()
	if !v.Equals(defv) && (op != cue.NoOp || has) {
		all = append(all, dvals...)
		for _, dv := range dvals {
			all = append(all, flatten(dv)...)
		}
	}
	return all
}
