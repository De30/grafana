package coremodel

import (
	"github.com/grafana/thema"
)

// Coremodel is the meta-schema that governs all Grafana coremodel declarations.
// A coremodel is a canonical Grafana entity type that is compiled in to Grafana.
// Each #Coremodel declaration describes exactly one kind of Grafana object -
// e.g. dashboard, datasource, team.
//
// A #Coremodel consists of a single Thema lineage, plus Grafana-specific metadata.
#Coremodel: {
	// name is the canonical lower case shortname for the type. It is the same as
	// the lineage name.
	N=name: =~"^[a-z_-]{40}$"

	// lineage is the Thema lineage containing the entire schema history for the object.
	lineage: thema.#Lineage & { name: N }

	// isCanonical indicates whether the coremodel has left the experimental phase
	// and is the canonical representation of the object.
	//
	// Known effects of a coremodel not being marked as canonical:
	//  - TypeScript types generated in @grafana-schema are not exported
	//  - Go types in grok (github.com/grafana/grok) are generated under
	//    types/<coremodel>/x rather than types/coremodel/v<major>.
	//  - Schema changes are made in-place on the 0.0 Thema schema, rather than
	//    appending new schema versions. As such, Thema guarantees do not yet apply.
	isCanonical: bool | *true
}
