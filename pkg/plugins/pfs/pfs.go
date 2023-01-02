package pfs

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"
	"sync"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/errors"
	"cuelang.org/go/cue/parser"
	"github.com/grafana/grafana"
	"github.com/grafana/grafana/pkg/cuectx"
	"github.com/grafana/grafana/pkg/kindsys"
	"github.com/grafana/grafana/pkg/plugins/plugindef"
	"github.com/grafana/thema"
	"github.com/grafana/thema/load"
	"github.com/grafana/thema/vmux"
	"github.com/yalue/merged_fs"
)

var onceGP sync.Once
var defaultGP cue.Value

func doLoadGP(ctx *cue.Context) cue.Value {
	v, err := cuectx.BuildGrafanaInstance(ctx, filepath.Join("pkg", "plugins", "pfs"), "pfs", nil)
	if err != nil {
		// should be unreachable
		panic(err)
	}
	return v
}

func loadGP(ctx *cue.Context) cue.Value {
	if ctx == nil || ctx == cuectx.GrafanaCUEContext() {
		onceGP.Do(func() {
			defaultGP = doLoadGP(ctx)
		})
		return defaultGP
	}
	return doLoadGP(ctx)
}

// PermittedCUEImports returns the list of import paths that may be used in a
// plugin's grafanaplugin cue package.
//
// TODO probably move this into kindsys
func PermittedCUEImports() []string {
	return []string{
		"github.com/grafana/thema",
		"github.com/grafana/grafana/packages/grafana-schema/src/schema",
	}
}

func importAllowed(path string) bool {
	for _, p := range PermittedCUEImports() {
		if p == path {
			return true
		}
	}
	return false
}

var allowedImportsStr string

var allsi []*kindsys.SchemaInterface

func init() {
	all := make([]string, 0, len(PermittedCUEImports()))
	for _, im := range PermittedCUEImports() {
		all = append(all, fmt.Sprintf("\t%s", im))
	}
	allowedImportsStr = strings.Join(all, "\n")

	for _, s := range kindsys.SchemaInterfaces(nil) {
		allsi = append(allsi, s)
	}

	sort.Slice(allsi, func(i, j int) bool {
		return allsi[i].Name() < allsi[j].Name()
	})
}

// ParsePluginFS takes an fs.FS and checks that it represents exactly one valid
// plugin fs tree, with the fs.FS root as the root of the tree.
//
// It does not descend into subdirectories to search for additional plugin.json
// or .cue files.
//
// Calling this with a nil [thema.Runtime] (the singleton returned from
// [cuectx.GrafanaThemaRuntime] is used) will memoize certain CUE operations.
// Prefer passing nil unless a different thema.Runtime is specifically required.
func ParsePluginFS(pfs fs.FS, rt *thema.Runtime) (ParsedPlugin, error) {
	if pfs == nil {
		return ParsedPlugin{}, ErrEmptyFS
	}
	if rt == nil {
		rt = cuectx.GrafanaThemaRuntime()
	}

	lin, err := plugindef.Lineage(rt)
	if err != nil {
		panic(fmt.Sprintf("plugindef lineage is invalid or broken, needs dev attention: %s", err))
	}
	mux := vmux.NewTypedMux(lin.TypedSchema(), vmux.NewJSONCodec("plugin.json"))
	ctx := rt.Context()


	b, err := fs.ReadFile(pfs, "plugin.json")
	if err != nil {
		if errors.Is(err, fs.ErrNotExist) {
			return ParsedPlugin{}, ErrNoRootFile
		}
		return ParsedPlugin{}, fmt.Errorf("error reading plugin.json: %w", err)
	}

	pp := ParsedPlugin{
		ComposableKinds: make(map[string]kindsys.Decl[kindsys.ComposableProperties]),
		CustomKinds:     make(map[string]kindsys.Decl[kindsys.CustomStructuredProperties]),
	}

	// Pass the raw bytes into the muxer, get the populated PluginDef type out that we want.
	// TODO stop ignoring second return. (for now, lacunas are a WIP and can't occur until there's >1 schema in the plugindef lineage)
	pinst, _, err := mux(b)
	if err != nil {
		// TODO more nuanced error handling by class of Thema failure
		return ParsedPlugin{}, ewrap(err, ErrInvalidRootFile)
	}
	pp.Properties = *(pinst.ValueP())

	if cuefiles, err := fs.Glob(pfs, "*.cue"); err != nil {
		return ParsedPlugin{}, fmt.Errorf("error globbing for cue files in pfs: %w", err)
	} else if len(cuefiles) == 0 {
		return pp, nil
	}

		gpv := loadGP(rt.Context())
		// TODO introduce layered CUE dependency-injecting loader
		//
		// Until CUE has proper dependency management (and possibly even after), loading
		// CUE files with non-stdlib CUEImports requires injecting the imported packages
		// into cue.mod/pkg/<import path>, unless the CUEImports are within the same CUE
		// module. Thema introduced a system for this for its dependers, which we use
		// here, but we'll need to layer the same on top for importable Grafana packages.
		// Needing to do this twice strongly suggests it needs a generic, standalone
		// library.

		mfs := merged_fs.NewMergedFS(pfs, grafana.CueSchemaFS)

		// Note that this actually will load any .cue files in the fs.FS root dir in the plugindef.PkgName.
		// That's...maybe good? But not what it says on the tin
		bi, err := load.InstanceWithThema(mfs, "", load.Package(plugindef.PkgName))
		if err != nil {
			return ParsedPlugin{}, fmt.Errorf("loading models.cue failed: %w", err)
		}

		pf, _ := parser.ParseFile("models.cue", modbyt, parser.ParseComments)

		for _, im := range pf.Imports {
			ip := strings.Trim(im.Path.Value, "\"")
			if !importAllowed(ip) {
				return ParsedPlugin{}, ewrap(errors.Newf(im.Pos(), "import %q in grafanaplugin cue package not allowed, plugins may only import from:\n%s\n", ip, allowedImportsStr), ErrDisallowedCUEImport)
			}
			pp.CUEImports = append(pp.CUEImports, im)
		}

		val := ctx.BuildInstance(bi)
		if val.Err() != nil {
			return ParsedPlugin{}, ewrap(fmt.Errorf("grafanaplugin package contains invalid CUE: %w", val.Err()), ErrInvalidCUE)
		}
		for _, si := range allsi {
			iv := val.LookupPath(cue.ParsePath(si.Name()))
			props, err := kindsys.ToKindProps[kindsys.ComposableProperties](iv)
			lin, err := bindCompoLineage(iv, si, pp.Properties, rt)
			if lin != nil {
				pp.ComposableKinds[si.Name()] = kindsys.Decl[kindsys.ComposableProperties]{
					Properties: ,
				}
			}
			if err != nil {
				return ParsedPlugin{}, err
			}
		}
}

func bindCompoLineage(v cue.Value, s *kindsys.SchemaInterface, meta plugindef.PluginDef, rt *thema.Runtime, opts ...thema.BindOption) (thema.Lineage, error) {
	should := s.Should(meta.Type)
	exists := v.Exists()

	if !exists {
		if should {
			return nil, ewrap(fmt.Errorf("%s: %s plugins should provide a %s composable kind in grafanaplugin cue package", meta.Id, meta.Type, s.Name()), ErrExpectedComposable)
		}
		return nil, nil
	}

	lin, err := thema.BindLineage(v, rt, opts...)
	if err != nil {
		return nil, ewrap(fmt.Errorf("%s: invalid thema lineage for %s composable kind: %w", meta.Id, s.Name(), err), ErrInvalidLineage)
	}

	// TODO reconsider all this in the context of #GrafanaPlugin and new thema decl structure/name constraints
	sanid := sanitizePluginId(meta.Id)
	if lin.Name() != sanid {
		errf := func(format string, args ...interface{}) error {
			var errin error
			if n := v.LookupPath(cue.ParsePath("name")).Source(); n != nil {
				errin = errors.Newf(n.Pos(), format, args...)
			} else {
				errin = fmt.Errorf(format, args...)
			}
			return ewrap(errin, ErrLineageNameMismatch)
		}
		if sanid != meta.Id {
			return nil, errf("%s: %q composable kind lineage name must be the sanitized plugin id (%q), got %q", meta.Id, s.Name(), sanid, lin.Name())
		} else {
			return nil, errf("%s: %q composable kind lineage name must be the plugin id, got %q", meta.Id, s.Name(), lin.Name())
		}
	}

	if !should {
		return lin, ewrap(fmt.Errorf("%s: %s plugins should not provide a %s composable kind in grafanaplugin cue package", meta.Id, meta.Type, s.Name()), ErrComposableNotExpected)
	}
	return lin, nil
}

// ParsedPlugin IDs are allowed to contain characters that aren't allowed in thema
// Lineage names, CUE package names, Go package names, TS or Go type names, etc.
func sanitizePluginId(s string) string {
	return strings.Map(func(r rune) rune {
		switch {
		case r >= 'a' && r <= 'z':
			fallthrough
		case r >= 'A' && r <= 'Z':
			fallthrough
		case r >= '0' && r <= '9':
			fallthrough
		case r == '_':
			return r
		case r == '-':
			return '_'
		default:
			return -1
		}
	}, s)
}

func ewrap(actual, is error) error {
	return &errPassthrough{
		actual: actual,
		is:     is,
	}
}

type errPassthrough struct {
	actual error
	is     error
}

func (e *errPassthrough) Is(err error) bool {
	return errors.Is(err, e.actual) || errors.Is(err, e.is)
}

func (e *errPassthrough) Error() string {
	return e.actual.Error()
}
