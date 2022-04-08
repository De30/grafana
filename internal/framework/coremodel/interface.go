package coremodel

import (
	"github.com/grafana/thema"
	"github.com/grafana/thema/kernel"
)

// Interface is the primary coremodel interface that must be implemented by all
// Grafana coremodels.  A coremodel is the foundational, canonical schema for
// some known-at-compile-time Grafana object.
//
// Currently, all Coremodels are expressed as Thema lineages.
type Interface interface {
	// Lineage should return the canonical Thema lineage for the coremodel.
	Lineage() thema.Lineage

	// CurrentSchema should return the schema of the version that the Grafana backend
	// is currently written against. (While Grafana can accept data from all
	// older versions of the Thema schema, backend Go code is written against a
	// single version for simplicity)
	CurrentSchema() thema.Schema

	// GoType should return a pointer to the Go struct type that corresponds to
	// the Current() schema.
	GoType() interface{}
}

func JSONKernelFor(i Interface) kernel.InputKernel {
	k, err := kernel.NewInputKernel(kernel.InputKernelConfig{
		Lineage:     i.Lineage(),
		TypeFactory: func() interface{} { return i.GoType() },
		Loader:      kernel.NewJSONDecoder(i.Lineage().Name() + ".json"),
		To:          i.CurrentSchema().Version(),
	})
	// It is required that all Interface implementations have aligned their Go
	// type with the Thema schema. There's no way to remediate the problem at runtime
	// if they haven't, so panic.
	if err != nil {
		panic(err)
	}

	return k
}
