package manager

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"

	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/httpclient"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/infra/usagestats"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/eventactions"
	"github.com/grafana/grafana/pkg/services/eventactions/api"
	"github.com/grafana/grafana/pkg/services/eventactions/database"
	"github.com/grafana/grafana/pkg/setting"
)

type EventActionsService struct {
	store eventactions.Store
	log   log.Logger
}

func ProvideEventActionsService(
	cfg *setting.Cfg,
	ac accesscontrol.AccessControl,
	routeRegister routing.RouteRegister,
	usageStats usagestats.Service,
	eventActionsStore eventactions.Store,
	permissionService accesscontrol.EventActionPermissionsService,
) (*EventActionsService, error) {
	database.InitMetrics()
	s := &EventActionsService{
		store: eventActionsStore,
		log:   log.New("eventactions"),
	}

	s.log.Info("Registering event actions")

	if err := RegisterRoles(ac); err != nil {
		s.log.Error("Failed to register roles", "error", err)
	}

	usageStats.RegisterMetricsFunc(s.store.GetUsageMetrics)

	eventactionsAPI := api.NewEventActionsAPI(cfg, s, ac, routeRegister, s.store, permissionService)
	eventactionsAPI.RegisterAPIEndpoints()

	return s, nil
}

func (sa *EventActionsService) Run(ctx context.Context) error {
	sa.log.Debug("Started Event Action Metrics collection service")
	return sa.store.RunMetricsCollection(ctx)
}

func (sa *EventActionsService) CreateEventAction(ctx context.Context, orgID int64, form *eventactions.CreateEventActionForm) (*eventactions.EventActionDetailsDTO, error) {
	return sa.store.CreateEventAction(ctx, orgID, form)
}

func (sa *EventActionsService) DeleteEventAction(ctx context.Context, orgID, eventActionID int64) error {
	return sa.store.DeleteEventAction(ctx, orgID, eventActionID)
}

func (sa *EventActionsService) RetrieveEventActionByName(ctx context.Context, orgID int64, name string) (*eventactions.EventActionDetailsDTO, error) {
	return sa.store.RetrieveEventActionByName(ctx, orgID, name)
}

func (sa *EventActionsService) RetrieveEventActionsByRegisteredEvent(ctx context.Context, orgID int64, eventName string) ([]*eventactions.EventActionDetailsDTO, error) {
	return sa.store.RetrieveEventActionsByRegisteredEvent(ctx, orgID, eventName)
}

type EventsService struct {
	log     log.Logger
	store   eventactions.EventStore
	actions eventactions.Store
	client  *http.Client
}

func ProvideEventsService(store eventactions.EventStore, actionsStore eventactions.Store, httpClientProvider httpclient.Provider) (*EventsService, error) {
	logger := log.New("events")
	logger.Info("Registering events service")

	client, err := httpClientProvider.New()
	if err != nil {
		return nil, err
	}

	s := &EventsService{
		log:     logger,
		store:   store,
		actions: actionsStore,
		client:  client,
	}

	return s, nil
}

func (s *EventsService) Register(ctx context.Context, form *eventactions.RegisterEventForm) (*eventactions.EventDTO, error) {
	return s.store.CreateEvent(ctx, form)
}

func (s *EventsService) ListEvents(ctx context.Context) ([]*eventactions.EventDTO, error) {
	return s.store.ListEvents(ctx)
}

func (s *EventsService) Unregister(ctx context.Context, eventName string) error {
	return s.store.DeleteEvent(ctx, eventName)
}

type webhookEvent struct {
	EventName string      `json:"event"`
	OrgId     int64       `json:"org_id"`
	Payload   interface{} `json:"payload"`
}

func (s *EventsService) Publish(ctx context.Context, orgID int64, eventName string, eventPayload interface{}) error {
	actions, err := s.actions.RetrieveEventActionsByRegisteredEvent(ctx, orgID, eventName)
	if err != nil {
		return err
	}

	// TODO these values should be configurable
	const numWorkers = 3
	const runnerURL = "http://localhost:8076"

	var wg sync.WaitGroup

	webhookPayload, err := json.Marshal(webhookEvent{
		EventName: eventName,
		OrgId:     orgID,
		Payload:   eventPayload,
	})
	if err != nil {
		return fmt.Errorf("cannot serialize external webhook payload: %w", err)
	}

	worker := func(jobs <-chan *eventactions.EventActionDetailsDTO) {
		defer wg.Done()
		wg.Add(1)

		for a := range jobs {
			switch a.Type {
			case string(eventactions.ActionTypeCode):

			case string(eventactions.ActionTypeWebhook):
				body := bytes.NewReader(webhookPayload)
				res, err := s.client.Post(a.URL, "application/json", body)
				if err != nil {
					s.log.Error("Failed to execute event action %d for event %d/%s: %w", a.Id, a.OrgId, a.Name)
					continue
				}
				s.log.Info("Event action %d for event %d/%s responded with %d", res.StatusCode)
			}
		}
	}

	jobs := make(chan *eventactions.EventActionDetailsDTO, len(actions))
	for w := 0; w < numWorkers; w++ {
		go worker(jobs)
	}
	for _, action := range actions {
		jobs <- action
	}
	close(jobs)

	wg.Wait()

	return nil
}
