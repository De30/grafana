package platformaton

import (
	"context"
	"sync"

	"github.com/grafana/grafana/pkg/bus"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/registry/corekind"
	"github.com/grafana/grafana/pkg/services/pluginsettings"
	"github.com/grafana/grafana/pkg/services/store/entity"
	"github.com/grafana/grafana/pkg/services/store/entity/sqlstash"
	smapi "github.com/grafana/synthetic-monitoring-api-go-client"
)

// We can do one of these platformatons per file - this'll be the first, for SM.
// k8s app can go in a separate file

func ProvideSMPlatformaton(store entity.EntityStoreServer, kreg *corekind.Base, bus bus.Bus, ps pluginsettings.Service) *SMPlato {
	logger := log.New("platformaton-sm")

	logger.Info("ProvideSMPlatformaton")

	return &SMPlato{
		log:            logger,
		store:          store,
		kreg:           kreg,
		bus:            bus,
		pluginSettings: ps,
	}
}

type SMPlato struct {
	log            log.Logger
	store          entity.EntityStoreServer
	kreg           *corekind.Base
	bus            bus.Bus
	pluginSettings pluginsettings.Service
	clientMutex    sync.Mutex
	client         *smapi.Client
}

func (p *SMPlato) Run(ctx context.Context) error {
	p.log.Info("SMPlato running...")

	p.clientMutex.Lock()
	if p.client == nil {
		if err := p.getSMClient(ctx); err != nil {
			p.clientMutex.Unlock()
			return err
		}
	}
	p.clientMutex.Unlock()

	c := make(chan (any))

	p.bus.AddEventListener(func(ctx context.Context, event *sqlstash.EntityWriteEvent) error {
		// not sure offhand if these will be the capital or lowercase name strings :/
		p.log.Info("processing event", "event", event)
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
			p.log.Info("SMPlato stopping...")
			return nil
		}
	}
}

func (p *SMPlato) getSMClient(ctx context.Context) error {
	settings, err := p.pluginSettings.GetPluginSettingByPluginID(
		ctx,
		&pluginsettings.GetByPluginIDArgs{PluginID: "grafana-synthetic-monitoring-app", OrgID: 1},
	)
	if err != nil {
		p.log.Error("loading settings", "error", err)
		return err
	}

	secrets := p.pluginSettings.DecryptedValues(settings)

	smcfg := extractSettings(settings.JSONData)

	smcfg.PublisherToken = secrets["publisherToken"]

	p.client, err = getSmClient(ctx, smcfg)
	return err
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

type smconfig struct {
	APIUrl            string
	StackId           int64
	LogsDS            string
	LogsInstanceId    int64
	MetricsDS         string
	MetricsInstanceId int64
	PublisherToken    string
}

func getSmClient(ctx context.Context, cfg smconfig) (*smapi.Client, error) {
	client := smapi.NewClient(cfg.APIUrl, "", nil)
	_, err := client.Install(ctx, cfg.StackId, cfg.MetricsInstanceId, cfg.LogsInstanceId, cfg.PublisherToken)
	if err != nil {
		return nil, err
	}

	return client, nil
}

func extractSettings(jsonData map[string]any) smconfig {
	var cfg smconfig

	if apiHost, ok := jsonData["apiHost"].(string); ok {
		cfg.APIUrl = apiHost
	}

	if logs, ok := jsonData["logs"].(map[string]any); ok {
		if str, ok := logs["grafanaName"].(string); ok {
			cfg.LogsDS = str
		}

		if id, ok := logs["hostedId"].(float64); ok {
			cfg.LogsInstanceId = int64(id)
		}
	}

	if metrics, ok := jsonData["metrics"].(map[string]any); ok {
		if str, ok := metrics["grafanaName"].(string); ok {
			cfg.MetricsDS = str
		}

		if id, ok := metrics["hostedId"].(float64); ok {
			cfg.MetricsInstanceId = int64(id)
		}
	}

	if id, ok := jsonData["stackId"].(float64); ok {
		cfg.StackId = int64(id)
	}

	return cfg
}
