package database

//nolint:goimports
import (
	"context"

	"github.com/grafana/grafana/pkg/infra/kvstore"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/apikey"
	"github.com/grafana/grafana/pkg/services/eventactions"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

const eventActionTable = "event_action"

type EventActionsStoreImpl struct {
	sqlStore      *sqlstore.SQLStore
	apiKeyService apikey.Service
	kvStore       kvstore.KVStore
	log           log.Logger
}

func ProvideEventActionsStore(store *sqlstore.SQLStore, apiKeyService apikey.Service, kvStore kvstore.KVStore) *EventActionsStoreImpl {
	return &EventActionsStoreImpl{
		sqlStore:      store,
		apiKeyService: apiKeyService,
		kvStore:       kvStore,
		log:           log.New("eventactions.store"),
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
