package pfs

import (
	"fmt"
	"io/fs"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"testing/fstest"

	"cuelang.org/go/cue"
	"cuelang.org/go/cue/build"
	"cuelang.org/go/cue/cuecontext"
	"cuelang.org/go/cue/errors"
	"cuelang.org/go/cue/parser"
	"github.com/grafana/grafana/pkg/cuectx"
	"github.com/grafana/grafana/pkg/kindsys"
	"github.com/grafana/grafana/pkg/plugins/plugindef"
	"github.com/grafana/thema"
	"github.com/grafana/thema/load"
	"github.com/grafana/thema/vmux"
	"github.com/yalue/merged_fs"
)

// PackageName is the name of the CUE package that Grafana will load when
// looking for a Grafana plugin's kind declarations.
const PackageName = "grafanaplugin"

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
func ParsePluginFS(fsys fs.FS, rt *thema.Runtime) (ParsedPlugin, error) {
	if fsys == nil {
		return ParsedPlugin{}, ErrEmptyFS
	}
	if rt == nil {
		rt = cuectx.GrafanaThemaRuntime()
	}

	lin, err := plugindef.Lineage(rt)
	if err != nil {
		panic(fmt.Sprintf("plugindef lineage is invalid or broken, needs dev attention: %s", err))
	}
	ctx := rt.Context()

	b, err := fs.ReadFile(fsys, "plugin.json")
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
	codec := vmux.NewJSONCodec("plugin.json")
	pinst, _, err := vmux.NewTypedMux(lin.TypedSchema(), codec)(b)
	if err != nil {
		// TODO more nuanced error handling by class of Thema failure
		return ParsedPlugin{}, ewrap(err, ErrInvalidRootFile)
	}
	pp.Properties = *(pinst.ValueP())

	if cuefiles, err := fs.Glob(fsys, "*.cue"); err != nil {
		return ParsedPlugin{}, fmt.Errorf("error globbing for cue files in fsys: %w", err)
	} else if len(cuefiles) == 0 {
		return pp, nil
	}

	gpv := loadGP(rt.Context())
	pinst.Underlying()

	fsys, err = ensureCueMod(fsys, pp.Properties)
	if err != nil {
		return ParsedPlugin{}, fmt.Errorf("%s has invalid cue.mod: %w", pp.Properties.Id, err)
	}

	bi, err := cuectx.LoadInstanceWithGrafana(fsys, "", load.Package(PackageName))
	if err != nil || bi.Err != nil {
		if err == nil {
			err = bi.Err
		}
		return ParsedPlugin{}, fmt.Errorf("%s did not load: %w", pp.Properties.Id, err)
	}
	b, _ = codec.Encode(pinst.Underlying()) // nolint:errcheck
	f, _ := parser.ParseFile("plugin.json", b)

	for _, f := range bi.Files {
		for _, im := range f.Imports {
			ip := strings.Trim(im.Path.Value, "\"")
			if !importAllowed(ip) {
				return ParsedPlugin{}, ewrap(errors.Newf(im.Pos(), "import of %q in grafanaplugin cue package not allowed, plugins may only import from:\n%s\n", ip, allowedImportsStr), ErrDisallowedCUEImport)
			}
			pp.CUEImports = append(pp.CUEImports, im)
		}
	}

	// build.Instance.Files has a comment indicating the CUE authors want to change
	// its behavior. This is a tripwire to tell us if/when they do that - otherwise, if
	// the change they make ends up making bi.Files empty, the above loop will silently
	// become a no-op, and we'd lose enforcement of import restrictions in plugins without
	// realizing it.
	if len(bi.Files) != len(bi.BuildFiles) {
		panic("Upstream CUE implementation changed, bi.Files is no longer populated")
	}

	// Inject the JSON directly into the build so it gets loaded together
	bi.BuildFiles = append(bi.BuildFiles, &build.File{
		Filename: "plugin.json",
		Encoding: build.JSON,
		Form:     build.Data,
		Source:   b,
	})
	bi.Files = append(bi.Files, f)

	gpi := ctx.BuildInstance(bi).Unify(gpv)
	var cerr errors.Error
	gpi.Walk(func(v cue.Value) bool {
		if lab, has := v.Label(); has {
			fmt.Println(lab)
			if err := v.Validate(cue.Concrete(lab != "lineage")); err != nil {
				cerr = errors.Append(cerr, errors.Promote(err, ""))
			}
			return lab != "lineage"
		}
		return true
	}, nil)
	if cerr != nil {
		return ParsedPlugin{}, fmt.Errorf("%s not an instance of grafanaplugin: %w", pp.Properties.Id, cerr)
	}

	// for _, top := range []string{"customKinds", "composableKinds"} {
	//
	// }

	val := ctx.BuildInstance(bi)
	if val.Err() != nil {
		return ParsedPlugin{}, ewrap(fmt.Errorf("grafanaplugin package contains invalid CUE: %w", val.Err()), ErrInvalidCUE)
	}
	for _, si := range allsi {
		iv := val.LookupPath(cue.ParsePath(si.Name()))
		props, err := kindsys.ToKindProps[kindsys.ComposableProperties](iv)
		if err != nil {
			return ParsedPlugin{}, err
		}
		lin, err := bindCompoLineage(iv, si, pp.Properties, rt)
		if lin != nil {
			pp.ComposableKinds[si.Name()] = kindsys.Decl[kindsys.ComposableProperties]{
				Properties: props,
			}
		}
		if err != nil {
			return ParsedPlugin{}, err
		}
	}
}

func ensureCueMod(fsys fs.FS, pdef plugindef.PluginDef) (fs.FS, error) {
	if modf, err := fs.ReadFile(fsys, filepath.Join("cue.mod", "module.cue")); err != nil {
		if !errors.Is(err, fs.ErrNotExist) {
			return nil, err
		}
		return merged_fs.NewMergedFS(fsys, fstest.MapFS{
			"cue.mod/module.cue": &fstest.MapFile{Data: []byte(fmt.Sprintf(`module: "grafana.com/grafana/plugins/%s"`, pdef.Id))},
		}), nil
	} else if _, err := cuecontext.New().CompileBytes(modf).LookupPath(cue.MakePath(cue.Str("module"))).String(); err != nil {
		return nil, fmt.Errorf("error reading cue module name: %w", err)
	}

	return fsys, nil
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
