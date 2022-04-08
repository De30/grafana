package datasource

import (
	"testing"

	"cuelang.org/go/cue"
	"github.com/grafana/grafana/internal/cuectx"
	"github.com/grafana/grafana/internal/framework/coremodel"
	"github.com/grafana/thema/kernel"
)

// Context-like values for bootstrapping CUE objects and Thema. These are mostly
// hidden away from day-to-day use by the coremodel framework; there's no
// threading them through function signatures like with context.Context.
var lib = cuectx.ProvideThemaLibrary()
var ctx = cuectx.ProvideThemaLibrary().Context()

// Invalid datasource JSON
var invalid = []byte(`{ "name": "sloth" }`)
var invaliddsCue cue.Value // populated in init
// Valid datasource JSON - even though access field is absent! Yay defaults
var valid = []byte(`{
	"name": "sloth",
	"type": "slothStats",
	"typeLogoUrl": "",
	"url": "",
	"password": "",
	"user": "",
	"database": "",
	"basicAuth": true,
	"basicAuthUser": "",
	"basicAuthPassword": "",
	"version": 4,
	"jsonData": ""
}`)
var validdsCue cue.Value // populated in init

func init() {
	// Lets us turn JSON into a cue.Value, which is what Thema's APIs expect.
	decoder := kernel.NewJSONDecoder("datasource.json")
	invaliddsCue, _ = decoder(ctx, invalid)
	validdsCue, _ = decoder(ctx, valid)
}

func TestShowSingleSchemaActions(t *testing.T) {
	cm, _ := ProvideCoremodel(lib)
	sch := cm.CurrentSchema() // The current (and only) Datasource schema declared in the lineage, version 0.0.

	_, err := sch.Validate(invaliddsCue)
	if err == nil {
		t.Fatal("JSON input should have failed validation")
	}
	t.Log(err) // (reports what fields are missing, etc.)

	inst, err := sch.Validate(validdsCue)
	if err != nil {
		t.Fatal(err)
	}

	// This call would translate the JSON to the 1.0 schema from the lineage.
	// That version doesn't exist, though.
	// inst.Translate(thema.SV(1, 0))

	b, _ := inst.UnwrapCUE().MarshalJSON()
	t.Log(string(b)) // (original JSON)
	// Thema has some TODOs for controlling whether printed output should be
	// include defaults ("hydrated") or not ("dehydrated"). Couple days' work,
	// @ying-jeanne already did the hard part.

	// There's also some Thema TODOs for methods to report whether the input
	// JSON actually contained a default value or not, letting us get around
	// Go's chronically confusing zero values.

}

func TestShowMultiSchemaActions(t *testing.T) {
	cm, _ := ProvideCoremodel(lib)
	lin := cm.Lineage()

	// Loops over all schemas in the lineage to find the first one the input
	// validates against, if any.
	inst := lin.ValidateAny(validdsCue)
	// Figure out which version matched:
	t.Log(inst.Schema().Version()) // 0.0
}

func TestShowKernelConverge(t *testing.T) {
	cm, _ := ProvideCoremodel(lib)

	// Thema's InputKernels encapsulate all of this behavior into the essence of
	// what coremodels do, and what we want for Grafana: to know of and be able
	// to consume raw data from multiple schema versions, but pretend that only
	// one exists in our actual Go code.
	k := coremodel.JSONKernelFor(cm)

	// Raw JSON bytes in, error out, because it's not valid.
	_, _, err := k.Converge(invalid)
	if err == nil {
		t.Fatal(err)
	}

	// Raw JSON bytes in, model out. Picture running this in an HTTP middleware,
	// or on bytes from files on disk.
	im, _, err := k.Converge(valid)
	if err != nil {
		t.Fatal(err)
	}
	m := im.(*Model)

	// Thema's goal is that, even if we write a thousand new versions of the
	// datasource schema, even across breaking changes, even if the bytes are
	// from a newer version of the schema than the running version of Grafana is
	// wants, the Converge call (powered by *Instance.Translate(), from above)
	// still works.
	//
	// The checks in Thema that make these goals perfect guarantees are at
	// different stages of maturity, but that doesn't affect us until we start
	// having multiple schemas. That makes now a good time for GL devs to play
	// with CUE and Thema's API while coremodels are still experimental, and
	// while those guarantees get polished.
	_ = m
}
