package outgoingevents

import (
	"context"
	"fmt"
	"sync"

	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/setting"
)

type Service interface {
	Publish(ctx context.Context, event Event, payload interface{}) error
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

func (s *OutgoingEventsService) Publish(ctx context.Context, event Event, payload interface{}) error {
	var handlers []EventHandler

	err := s.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		return sess.Where("event = ?", event).Find(&handlers)
	})
	if err != nil {
		return fmt.Errorf("listing event %s handlers: %w", event, err)
	}

	// If there are no handlers this method shouldn't fail, it just
	// means no-one is interested in the event.

	// TODO the number of workers should be configurable
	const numWorkers = 3

	var wg sync.WaitGroup
	worker := func(handlers <-chan EventHandler) {
		defer wg.Done()
		wg.Add(1)

		for h := range handlers {
			if h.IsScript() {
				// TODO send script to runner
			} else {
				// TODO send event to external webhook
			}
		}
	}

	jobs := make(chan EventHandler, len(handlers))
	for w := 0; w < numWorkers; w++ {
		go worker(jobs)
	}
	for _, handler := range handlers {
		jobs <- handler
	}
	close(jobs)

	wg.Wait()

	return nil
}
