package database

//nolint:goimports
import (
	"context"
	"fmt"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/eventactions"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

const eventActionTable = "event_action"

type EventActionsStoreImpl struct {
	sqlStore   *sqlstore.SQLStore
	eventStore eventactions.EventStore
	log        log.Logger
}

func ProvideEventActionsStore(store *sqlstore.SQLStore, eventStore eventactions.EventStore) *EventActionsStoreImpl {
	return &EventActionsStoreImpl{
		sqlStore:   store,
		eventStore: eventStore,
		log:        log.New("eventactions.store"),
	}
}

// CreateEventAction creates event action
func (s *EventActionsStoreImpl) CreateEventAction(ctx context.Context, orgId int64, form *eventactions.CreateEventActionForm) (*eventactions.EventActionDetailsDTO, error) {
	createErr := s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) (err error) {
		action := &eventactions.EventActionDetailsDTO{
			OrgId: orgId,
			Name:  form.Name,
			Type:  string(eventactions.ActionTypeCode),
		}

		_, err = sess.Incr("id").Insert(action)
		return err
	})
	if createErr != nil {
		return nil, createErr
	}

	return s.RetrieveEventActionByName(ctx, orgId, form.Name)
}

// UpdateEventAction updates event action
func (s *EventActionsStoreImpl) UpdateEventAction(ctx context.Context, orgId, eventActionId int64, form *eventactions.EventActionDetailsDTO) (*eventactions.EventActionDetailsDTO, error) {
	updateErr := s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		form.OrgId = orgId
		_, err := sess.Where("id = ?", eventActionId).Update(form)
		return err
	})

	if updateErr != nil {
		return nil, updateErr
	}

	if err := s.updateEventRegistration(ctx, eventActionId, form.EventRegistration); err != nil {
		return nil, err
	}

	return s.RetrieveEventAction(ctx, orgId, eventActionId)
}

// DeleteEventAction deletes event action and all associated tokens
func (s *EventActionsStoreImpl) DeleteEventAction(ctx context.Context, orgId, eventActionId int64) error {
	return s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		action := eventactions.EventActionDTO{}
		has, err := sess.Where(`org_id = ? and id = ?`, orgId, eventActionId).Get(&action)
		if err != nil {
			return err
		}
		if !has {
			return eventactions.ErrEventActionNotFound
		}
		_, err = sess.Delete(&action)
		return err
	})
}

// RetrieveEventAction returns a event action by its ID
func (s *EventActionsStoreImpl) RetrieveEventAction(ctx context.Context, orgId, eventActionId int64) (*eventactions.EventActionDetailsDTO, error) {
	eventAction := &eventactions.EventActionDetailsDTO{}

	err := s.sqlStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		sess.Where(`org_id = ? and id = ?`, orgId, eventActionId)

		if ok, err := sess.Get(eventAction); err != nil {
			return err
		} else if !ok {
			return eventactions.ErrEventActionNotFound
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	eventAction.EventRegistration, err = s.retrieveEventRegistration(ctx, eventAction.Id)
	if err != nil {
		return nil, err
	}

	return eventAction, err
}

func (s *EventActionsStoreImpl) RetrieveEventActionByName(ctx context.Context, orgId int64, name string) (*eventactions.EventActionDetailsDTO, error) {
	eventAction := &eventactions.EventActionDetailsDTO{}

	err := s.sqlStore.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if ok, err := sess.Where("org_id = ? and name = ?", orgId, name).Get(eventAction); err != nil {
			return err
		} else if !ok {
			return eventactions.ErrEventActionNotFound
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	eventAction.EventRegistration, err = s.retrieveEventRegistration(ctx, eventAction.Id)
	if err != nil {
		return nil, err
	}

	return eventAction, nil
}

func (s *EventActionsStoreImpl) SearchOrgEventActions(ctx context.Context, orgId int64, query string, typeFilter string, page int, limit int) (*eventactions.SearchEventActionsResult, error) {
	searchResult := &eventactions.SearchEventActionsResult{
		TotalCount:   0,
		EventActions: make([]*eventactions.EventActionDTO, 0),
		Page:         page,
		PerPage:      limit,
	}

	err := s.sqlStore.WithDbSession(ctx, func(dbSess *sqlstore.DBSession) error {
		sess := dbSess.Table(eventActionTable)

		sess = sess.Where("org_id = ?", orgId)

		if query != "" {
			queryWithWildcards := "%" + query + "%"
			sess = sess.And("name "+s.sqlStore.Dialect.LikeStr()+" ?", queryWithWildcards)
		}

		if typeFilter != "" {
			sess = sess.And("type = ?", typeFilter)
		}

		countSess := sess.Clone()

		if limit > 0 {
			offset := limit * (page - 1)
			sess = sess.Limit(limit, offset)
		}

		sess = sess.Cols(
			"id",
			"name",
			"org_id",
			"type",
			"url",
		).Asc("type", "name")
		if err := sess.Find(&searchResult.EventActions); err != nil {
			return err
		}

		// get total
		count, err := countSess.Count()
		searchResult.TotalCount = count
		return err
	})

	return searchResult, err
}

func (s *EventActionsStoreImpl) RetrieveEventActionsByRegisteredEvent(ctx context.Context, orgID int64, eventName string) ([]*eventactions.EventActionDetailsDTO, error) {
	var eventActionIds []int64
	err := s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		err := sess.Table("event_action_registration").
			Join("INNER", s.sqlStore.Dialect.Quote("event"), "event_action_registration.event_id = event.id").
			Join("INNER", s.sqlStore.Dialect.Quote("event_action"), "event_action_registration.event_action_id = event_action.id").
			Where("event.name = ?", eventName).
			And("event_action.org_id = ?", orgID).
			Select("event_action_id").Find(&eventActionIds)

		return err
	})
	if err != nil {
		return nil, err
	}

	eventActions := make([]*eventactions.EventActionDetailsDTO, 0)
	for _, eventActionId := range eventActionIds {
		eventAction, err := s.RetrieveEventAction(ctx, orgID, eventActionId)
		if err != nil {
			return nil, err
		}
		eventActions = append(eventActions, eventAction)
	}
	return eventActions, nil

}

type registrationRecord struct {
	EventActionId int64 `xorm:"event_action_id"`
	EventId       int64 `xorm:"event_id"`
}

func (r *registrationRecord) TableName() string {
	return "event_action_registration"
}

func (s *EventActionsStoreImpl) retrieveEventRegistration(ctx context.Context, eventActionId int64) ([]eventactions.EventRegistrationDTO, error) {
	events, err := s.eventStore.ListEvents(ctx)
	if err != nil {
		return nil, err
	}

	registrations := make([]eventactions.EventRegistrationDTO, 0)
	err = s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		var dbRegistrations []registrationRecord
		if err := sess.Table("event_action_registration").Where("event_action_id = ?", eventActionId).Find(&dbRegistrations); err != nil {
			return err
		}
		for _, event := range events {
			enabled := false
			for _, dbRegistration := range dbRegistrations {
				if dbRegistration.EventId == event.Id {
					enabled = true
					break
				}
			}
			registrations = append(registrations, eventactions.EventRegistrationDTO{
				EventDTO: eventactions.EventDTO{
					Id:          event.Id,
					Name:        event.Name,
					Description: event.Description,
				},
				Enabled: enabled,
			})
		}

		return nil
	})

	return registrations, err
}

func (s *EventActionsStoreImpl) updateEventRegistration(ctx context.Context, eventActionId int64, newRegistrations []eventactions.EventRegistrationDTO) error {
	err := s.sqlStore.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		var currentRegistrations []registrationRecord
		if err := sess.Table("event_action_registration").Where("event_action_id = ?", eventActionId).Find(&currentRegistrations); err != nil {
			return err
		}

		// Remove current registrations that are not in the new list
		for _, currentRegistration := range currentRegistrations {
			toRemove := true
			for _, newRegistration := range newRegistrations {
				if currentRegistration.EventId == newRegistration.Id {
					toRemove = false
				}
			}

			if toRemove {
				if _, err := sess.Delete(&currentRegistration); err != nil {
					return fmt.Errorf("failed to delete registration for event %d: %w", currentRegistration.EventId, err)
				}
			}
		}

		// Add registrations if they are not in the current list
		// Remove registrations if they are in the current list but disabled in the new list
		for _, newRegistration := range newRegistrations {
			var toRemove *registrationRecord
			toAdd := newRegistration.Enabled
			for _, currentRegistration := range currentRegistrations {
				if currentRegistration.EventId == newRegistration.Id {
					toAdd = false
					if !newRegistration.Enabled {
						toRemove = &currentRegistration
					}
					break
				}
			}

			if toAdd {
				if _, err := sess.Insert(&registrationRecord{
					EventActionId: eventActionId,
					EventId:       newRegistration.Id,
				}); err != nil {
					return fmt.Errorf("failed to insert registration for event %d: %w", newRegistration.Id, err)
				}
			}
			if toRemove != nil {
				if _, err := sess.Delete(toRemove); err != nil {
					return fmt.Errorf("failed to delete registration for event %d: %w", newRegistration.Id, err)
				}
			}

		}

		return nil
	})

	return err
}

const eventTable = "event"

type EventStoreImpl struct {
	store *sqlstore.SQLStore
	log   log.Logger
}

func ProvideEventStore(store *sqlstore.SQLStore) *EventStoreImpl {
	return &EventStoreImpl{
		store: store,
		log:   log.New("events.store"),
	}
}

func (s *EventStoreImpl) CreateEvent(ctx context.Context, form *eventactions.RegisterEventForm) (*eventactions.EventDTO, error) {
	event := &eventactions.EventDTO{
		Name:        form.Name,
		Description: form.Description,
	}

	err := s.store.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		cur := &eventactions.EventDTO{Name: form.Name}
		has, err := sess.Get(cur)
		if err != nil {
			return err
		}
		if has {
			event = cur
			return nil
		}

		id, err := sess.Incr("id").Insert(event)
		if err != nil {
			return err
		}

		event.Id = id
		return nil
	})
	if err != nil {
		return nil, err
	}

	return event, nil
}

func (s *EventStoreImpl) ListEvents(ctx context.Context) ([]*eventactions.EventDTO, error) {
	var events []*eventactions.EventDTO

	err := s.store.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		return sess.Table(eventTable).OrderBy("name").Find(&events)
	})
	if err != nil {
		return nil, err
	}

	return events, nil
}

func (s *EventStoreImpl) DeleteEvent(ctx context.Context, eventName string) error {
	return s.store.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		event := eventactions.EventDTO{}
		has, err := sess.Where(`name = ?`, eventName).Get(&event)
		if err != nil {
			return err
		}
		if has {
			_, err = sess.Delete(&event)
			return err
		}
		return nil
	})
}
