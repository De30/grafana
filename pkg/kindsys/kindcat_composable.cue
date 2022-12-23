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

	// slot is the name of the Grafana slot fulfilled by this Composable kind. The set
	// is open for future compatibility of Grafana and tooling with new slot additions.
	slot: or([for k, _ in slots {k}, string])

	// TODO unify this with the existing slots decls in pkg/framework/coremodel
	lineageIsGroup: bool & [
			if slot == "panel" {true},
			if slot == "dsoptions" {true},
			if slot == "queries" {false},
	][0]

	// lineage is the Thema lineage containing all the schemas that have existed for this kind.
	// It is required that lineage.name is the same as the [machineName].
	lineage: thema.#Lineage & {name: S.machineName, joinSchema: slots}
}

// GrafanaPluginInstance specifies what plugins may declare in .cue files in a
// `grafanaplugin` CUE package in the plugin root directory (adjacent to plugin.json).
#GrafanaPluginInstance: {
	id: string

	// A plugin declares all of its #ComposableKind under this key.
	//
	// This struct is open for forwards compatibility - older versions of Grafana (or
	// dependent tooling) should not break if new versions introduce additional slots.
	composableKinds: [Slot=string]: #Composable & {
		name: "\(Slot)-\(id)"
		slot: Slot
		lineage: joinSchema: [for slotname, def in slots if Slot == slotname { def }, {...}][0]
	}

	customKinds: [Name=string]: #CustomStructured & {
		name: Name
	}
	...
}
