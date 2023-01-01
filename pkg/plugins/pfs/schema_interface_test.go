package pfs

import (
	"sort"
	"testing"

	"cuelang.org/go/cue/cuecontext"
	"github.com/stretchr/testify/require"
)

// This is a brick-dumb test that just ensures known schema interfaces are being
// loaded correctly from their declarations in .cue files.
//
// If this test fails, it's either because:
// - They're not being loaded correctly - there's a bug in kindsys or pfs somewhere, fix it
// - The set of schema interfaces has been modified - update the static list here
func TestSchemaInterfacesAreLoaded(t *testing.T) {
	knownSI := []string{"panelcfg", "queries", "dscfg"}
	all := SchemaInterfaces(cuecontext.New())
	var loadedSI []string
	for k := range all {
		loadedSI = append(loadedSI, k)
	}

	sort.Strings(knownSI)
	sort.Strings(loadedSI)

	require.Equal(t, knownSI, loadedSI, "schema interfaces loaded from cue differs from known fixture set - either a bug or fixture needs updating")
}
