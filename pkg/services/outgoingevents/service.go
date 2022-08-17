package outgoingevents

import (
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/setting"
)

type Service interface {
	// Publish(event Event, payload interface{}) error
}

type OutgoingEventsService struct {
	cfg      *setting.Cfg
	log      log.Logger
	db       db.DB
	routeReg routing.RouteRegister
}

var _ Service = &OutgoingEventsService{}

func ProvideService(cfg *setting.Cfg, db db.DB, routeRegister routing.RouteRegister) *OutgoingEventsService {
	s := &OutgoingEventsService{
		cfg:      cfg,
		db:       db,
		routeReg: routeRegister,
		log:      log.New("grafana-do"),
	}

	return s
}
