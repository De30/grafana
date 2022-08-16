package outgoingevents

import (
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/setting"
)

type Service interface {
	// Publish(event Event, payload interface{}) error
}

type OutgoingEventsService struct {
	cfg      *setting.Cfg
	log      log.Logger
	store    *sqlstore.SQLStore
	routeReg routing.RouteRegister
}

var _ Service = &OutgoingEventsService{}

func ProvideService(cfg *setting.Cfg, store *sqlstore.SQLStore, routeRegister routing.RouteRegister) *OutgoingEventsService {
	s := &OutgoingEventsService{
		cfg:      cfg,
		store:    store,
		routeReg: routeRegister,
		log:      log.New("grafana-do"),
	}

	return s
}
