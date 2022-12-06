package platformaton

import (
	"context"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/registry/corekind"
	"github.com/grafana/grafana/pkg/services/store/entity"
	"github.com/grafana/grafana/pkg/services/store/entity/sqlstash"
)

// We can do one of these platformatons per file - this'll be the first, for SM.
// k8s app can go in a separate file

func ProvideSMPlatformaton(store entity.EntityStoreServer, kreg corekind.Base, bus bus.Bus) *SMPlato {
	return &SMPlato{
		log:   log.New("platformaton-sm"),
		store: store,
		kreg:  kreg,
		bus:   bus,
	}
}

type SMPlato struct {
	log   log.Logger
	store entity.EntityStoreServer
	kreg  corekind.Base
	bus   bus.Bus
}

func (p *SMPlato) Run(ctx context.Context) error {
	c := make(chan (any))

	p.bus.AddEventListener(func(ctx context.Context, event sqlstash.EntityWriteEvent) error {
		// not sure offhand if these will be the capital or lowercase name strings :/
		if event.Kind == "Service" || event.Kind == "PlatformatonSM" {
			// Don't block, just try to notify
			select {
			case c <- nil:
			default:
			}
		}
		return nil
	})

	for {
		select {
		case <-c:
			err := p.Reconcile()
			if err != nil {
				p.log.Error(err.Error())
			}
		case <-ctx.Done():
			return nil
		}
	}
}

// We care about
// 1. platformaton config
// 2. state of all types of matched inputs

func (p *SMPlato) Reconcile() error {
	// 1. load all entities we could possibly care about
	// 2. load all known transformaton configs from storage
	// 3. run generation process for all input uids according to loaded tf configs
	// 4. save generated objects to appropriate targets (local storage + SM API)

	ksvc := p.kreg.Service()

	// Pretend these bytes came back from an p.store.Read() call
	var b []byte
	// Transform the bytes into
	svc, _, err := ksvc.JSONValueMux(b)
	_ = svc
	// repeat to load platformaton config

	// then, implement logic to create checks, etc. from svc + pfsm
	// then, write 'em to the places they need to go

	return err
}
