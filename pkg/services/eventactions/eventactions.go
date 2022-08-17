package eventactions

import (
	"context"
)

// this should reflect the api
type Service interface {
	CreateEventAction(ctx context.Context, orgID int64, form *CreateEventActionForm) (*EventActionDetailsDTO, error)
	DeleteEventAction(ctx context.Context, orgID, EventActionID int64) error
	RetrieveEventActionByName(ctx context.Context, orgID int64, name string) (*EventActionDetailsDTO, error)
}

type Store interface {
	CreateEventAction(ctx context.Context, orgID int64, form *CreateEventActionForm) (*EventActionDetailsDTO, error)
	SearchOrgEventActions(ctx context.Context, orgID int64, query string, typeFilter string, page int, limit int) (*SearchEventActionsResult, error)
	UpdateEventAction(ctx context.Context, orgID, EventActionID int64, form *EventActionDetailsDTO) (*EventActionDetailsDTO, error)
	RetrieveEventAction(ctx context.Context, orgID, EventActionID int64) (*EventActionDetailsDTO, error)
	RetrieveEventActionByName(ctx context.Context, orgID int64, name string) (*EventActionDetailsDTO, error)
	DeleteEventAction(ctx context.Context, orgID, EventActionID int64) error
	GetUsageMetrics(ctx context.Context) (map[string]interface{}, error)
	RunMetricsCollection(ctx context.Context) error
}

type EventsService interface {
	Register(ctx context.Context, event *RegisterEventForm) (*EventDTO, error)
}

type EventStore interface {
	CreateEvent(ctx context.Context, event *RegisterEventForm) (*EventDTO, error)
}
