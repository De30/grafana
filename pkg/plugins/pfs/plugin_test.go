package pfs

import (
	"reflect"
	"sort"
	"strings"
	"testing"

	"cuelang.org/go/cue/cuecontext"
	"github.com/google/go-cmp/cmp"
	"github.com/grafana/grafana/pkg/kindsys"
)

// This is a brick-dumb test that just ensures known schema interfaces are being
// loaded correctly from their declarations in .cue files.
//
// If this test fails, it's either because:
// - They're not being loaded correctly - there's a bug in kindsys or pfs somewhere, fix it
// - The set of schema interfaces has been modified - update the static list here
func TestSchemaInterfacesAreLoaded(t *testing.T) {
	rt := reflect.TypeOf(ComposableKinds{})
	var knownSI []string
	for i := 0; i < rt.NumField(); i++ {
		knownSI = append(knownSI, strings.ToLower(rt.Field(i).Name))
	}
	all := kindsys.SchemaInterfaces(cuecontext.New())
	var loadedSI []string
	for k := range all {
		loadedSI = append(loadedSI, k)
	}

	sort.Strings(knownSI)
	sort.Strings(loadedSI)

	if diff := cmp.Diff(knownSI, loadedSI); diff != "" {
		t.Fatalf("kindsys cue-declared schema interfaces differ from ComposableKinds go struct:\n%s", diff)
	}

	if len(all) == 0 {
		t.Fatal("no schema interfaces loaded from cue")
	}
}
