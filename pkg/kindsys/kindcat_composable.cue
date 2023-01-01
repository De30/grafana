package kindsys

import (
	"github.com/grafana/thema"
)

// Composable is a category of structured kind that provides schema elements for
// composition into CoreStructured and CustomStructured kinds. Grafana plugins
// provide composable kinds; for example, a datasource plugin provides one to
// describe the structure of its queries, which is then composed into dashboards
// and alerting rules.
//
// Each Composable is an implementation of exactly one Slot, a shared meta-schema
// defined by Grafana itself that constrains the shape of schemas declared in
// that ComposableKind.
#Composable: S={
	_sharedKind
	form: "structured"

	// schemaInterface is the name of the Grafana schema interface implemented by
	// this Composable kind. The set is open to ensure forward compatibility of
	// Grafana and tooling with any additional schema interfaces that may be added.
	schemaInterface: or([ for k, _ in schemaInterfaces {k}, string])

	// lineage is the Thema lineage containing all the schemas that have existed for this kind.
	// It is required that lineage.name is the same as the [machineName].
	lineage: thema.#Lineage & {name: S.machineName}

	or([ for k, v in schemaInterfaces {
		schemaInterface: k
		lineage: joinSchema: v.interface
		lineageIsGroup: v.group
	}, {
		schemaInterface: string
	}])
}
