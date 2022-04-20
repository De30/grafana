package staticregistry

import (
	"github.com/google/wire"
	"github.com/grafana/grafana/pkg/coremodel/dashboard"
	"github.com/grafana/grafana/pkg/framework/coremodel"
)

// WireSet comprises the registry of all coremodels, and all their individual
// wire providers.
var WireSet = wire.NewSet(
	ProvideRegistry,
	dashboard.ProvideCoremodel,
)

// ProvideRegistry provides a simple static Registry for coremodels.
// Coremodels have to be manually added.
// TODO dynamism
func ProvideRegistry(
	dashboard *dashboard.Coremodel,
) (*coremodel.Registry, error) {
	return coremodel.NewRegistry(
		dashboard,
	)
}
