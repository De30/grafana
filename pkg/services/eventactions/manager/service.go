package manager

import (
	"context"

	"github.com/grafana/grafana/pkg/api/routing"
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
	log   log.Logger
	store eventactions.EventStore
}

func ProvideEventsService(store eventactions.EventStore) (*EventsService, error) {
	s := &EventsService{
		log:   log.New("events"),
		store: store,
	}

	s.log.Info("Registering events service")

	return s, nil
}

func (s *EventsService) Register(ctx context.Context, form *eventactions.RegisterEventForm) (*eventactions.EventDTO, error) {
	return s.store.CreateEvent(ctx, form)
}

func (s *EventsService) ListEvents(ctx context.Context) ([]*eventactions.EventDTO, error) {
	return s.store.ListEvents(ctx)
}
