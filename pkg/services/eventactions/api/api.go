package api

import (
	"errors"
	"net/http"
	"strconv"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/eventactions"
	"github.com/grafana/grafana/pkg/services/eventactions/database"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

type EventActionsAPI struct {
	cfg               *setting.Cfg
	service           eventactions.Service
	accesscontrol     accesscontrol.AccessControl
	RouterRegister    routing.RouteRegister
	store             eventactions.Store
	log               log.Logger
	permissionService accesscontrol.EventActionPermissionsService
}

func NewEventActionsAPI(
	cfg *setting.Cfg,
	service eventactions.Service,
	accesscontrol accesscontrol.AccessControl,
	routerRegister routing.RouteRegister,
	store eventactions.Store,
	permissionService accesscontrol.EventActionPermissionsService,
) *EventActionsAPI {
	return &EventActionsAPI{
		cfg:               cfg,
		service:           service,
		accesscontrol:     accesscontrol,
		RouterRegister:    routerRegister,
		store:             store,
		log:               log.New("eventactions.api"),
		permissionService: permissionService,
	}
}

func (api *EventActionsAPI) RegisterAPIEndpoints() {
	auth := accesscontrol.Middleware(api.accesscontrol)
	api.RouterRegister.Group("/api/eventactions", func(eventActionsRoute routing.RouteRegister) {
		eventActionsRoute.Get("/search", auth(middleware.ReqOrgAdmin,
			accesscontrol.EvalPermission(eventactions.ActionRead)), routing.Wrap(api.SearchOrgEventActionsWithPaging))
		eventActionsRoute.Post("/", auth(middleware.ReqOrgAdmin,
			accesscontrol.EvalPermission(eventactions.ActionCreate)), routing.Wrap(api.CreateEventAction))
		eventActionsRoute.Get("/:eventActionId", auth(middleware.ReqOrgAdmin,
			accesscontrol.EvalPermission(eventactions.ActionRead, eventactions.ScopeID)), routing.Wrap(api.RetrieveEventAction))
		eventActionsRoute.Patch("/:eventActionId", auth(middleware.ReqOrgAdmin,
			accesscontrol.EvalPermission(eventactions.ActionWrite, eventactions.ScopeID)), routing.Wrap(api.UpdateEventAction))
		eventActionsRoute.Delete("/:eventActionId", auth(middleware.ReqOrgAdmin,
			accesscontrol.EvalPermission(eventactions.ActionDelete, eventactions.ScopeID)), routing.Wrap(api.DeleteEventAction))
	})
}

// swagger:route POST /eventactions service_accounts createEventAction
//
// # Create event action
//
// Required permissions (See note in the [introduction](https://grafana.com/docs/grafana/latest/developers/http_api/eventaction/#service-account-api) for an explanation):
// action: `eventactions:write` scope: `eventactions:*`
//
// Requires basic authentication and that the authenticated user is a Grafana Admin.
//
// Responses:
// 201: createEventActionResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 500: internalServerError
func (api *EventActionsAPI) CreateEventAction(c *models.ReqContext) response.Response {
	cmd := eventactions.CreateEventActionForm{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "Bad request data", err)
	}

	eventAction, err := api.store.CreateEventAction(c.Req.Context(), c.OrgID, &cmd)
	switch {
	case errors.Is(err, database.ErrEventActionAlreadyExists):
		return response.Error(http.StatusBadRequest, "Failed to create event action", err)
	case err != nil:
		return response.Error(http.StatusInternalServerError, "Failed to create event action", err)
	}

	return response.JSON(http.StatusCreated, eventAction)
}

// swagger:route GET /eventactions/{eventActionId} service_accounts retrieveEventAction
//
// # Get single eventaction by Id
//
// Required permissions (See note in the [introduction](https://grafana.com/docs/grafana/latest/developers/http_api/eventaction/#service-account-api) for an explanation):
// action: `eventactions:read` scope: `eventactions:id:1` (single event action)
//
// Responses:
// 200: retrieveEventActionResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError
func (api *EventActionsAPI) RetrieveEventAction(ctx *models.ReqContext) response.Response {
	scopeID, err := strconv.ParseInt(web.Params(ctx.Req)[":eventActionId"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "Event Action ID is invalid", err)
	}

	eventAction, err := api.store.RetrieveEventAction(ctx.Req.Context(), ctx.OrgID, scopeID)
	if err != nil {
		switch {
		case errors.Is(err, eventactions.ErrEventActionNotFound):
			return response.Error(http.StatusNotFound, "Failed to retrieve event action", err)
		default:
			return response.Error(http.StatusInternalServerError, "Failed to retrieve event action", err)
		}
	}

	return response.JSON(http.StatusOK, eventAction)
}

// swagger:route PATCH /eventactions/{eventActionId} service_accounts updateEventAction
//
// # Update event action
//
// Required permissions (See note in the [introduction](https://grafana.com/docs/grafana/latest/developers/http_api/eventaction/#service-account-api) for an explanation):
// action: `eventactions:write` scope: `eventactions:id:1` (single event action)
//
// Responses:
// 200: updateEventActionResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 404: notFoundError
// 500: internalServerError
func (api *EventActionsAPI) UpdateEventAction(c *models.ReqContext) response.Response {
	scopeID, err := strconv.ParseInt(web.Params(c.Req)[":eventActionId"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "Event Action ID is invalid", err)
	}

	cmd := eventactions.EventActionDetailsDTO{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "Bad request data", err)
	}

	resp, err := api.store.UpdateEventAction(c.Req.Context(), c.OrgID, scopeID, &cmd)
	if err != nil {
		switch {
		case errors.Is(err, eventactions.ErrEventActionNotFound):
			return response.Error(http.StatusNotFound, "Failed to retrieve event action", err)
		default:
			return response.Error(http.StatusInternalServerError, "Failed update event action", err)
		}
	}

	return response.JSON(http.StatusOK, util.DynMap{
		"message":     "Event action updated",
		"id":          resp.Id,
		"name":        resp.Name,
		"eventaction": resp,
	})
}

// swagger:route DELETE /eventactions/{eventActionId} service_accounts deleteEventAction
//
// # Delete event action
//
// Required permissions (See note in the [introduction](https://grafana.com/docs/grafana/latest/developers/http_api/eventaction/#service-account-api) for an explanation):
// action: `eventactions:delete` scope: `eventactions:id:1` (single event action)
//
// Responses:
// 200: okResponse
// 400: badRequestError
// 401: unauthorisedError
// 403: forbiddenError
// 500: internalServerError
func (api *EventActionsAPI) DeleteEventAction(ctx *models.ReqContext) response.Response {
	scopeID, err := strconv.ParseInt(web.Params(ctx.Req)[":eventActionId"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "Event action ID is invalid", err)
	}
	err = api.service.DeleteEventAction(ctx.Req.Context(), ctx.OrgID, scopeID)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Event action deletion error", err)
	}
	return response.Success("Event action deleted")
}

// swagger:route GET /eventactions/search service_accounts searchOrgEventActionsWithPaging
//
// # Search event actions with paging
//
// Required permissions (See note in the [introduction](https://grafana.com/docs/grafana/latest/developers/http_api/eventaction/#service-account-api) for an explanation):
// action: `eventactions:read` scope: `eventactions:*`
//
// Responses:
// 200: searchOrgEventActionsWithPagingResponse
// 401: unauthorisedError
// 403: forbiddenError
// 500: internalServerError
func (api *EventActionsAPI) SearchOrgEventActionsWithPaging(c *models.ReqContext) response.Response {
	ctx := c.Req.Context()
	perPage := c.QueryInt("perpage")
	if perPage <= 0 {
		perPage = 1000
	}
	page := c.QueryInt("page")
	if page < 1 {
		page = 1
	}
	eventActionSearch, err := api.store.SearchOrgEventActions(ctx, c.OrgID, c.Query("query"), c.Query("type"), page, perPage)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to get event actions for current organization", err)
	}

	return response.JSON(http.StatusOK, eventActionSearch)
}

// swagger:parameters searchOrgEventActionsWithPaging
type SearchOrgEventActionsWithPagingParams struct {
	// It will return results where the query value is contained in one of the name.
	// Query values with spaces need to be URL encoded.
	// in:query
	// required:false
	Query string `json:"query"`
	// The default value is 1000.
	// in:query
	// required:false
	PerPage int `json:"perpage"`
	// The default value is 1.
	// in:query
	// required:false
	Page int `json:"page"`
}

// swagger:parameters createEventAction
type CreateEventActionParams struct {
	//in:body
	Body eventactions.CreateEventActionForm
}

// swagger:parameters retrieveEventAction
type RetrieveEventActionParams struct {
	// in:path
	EventActionId int64 `json:"eventActionId"`
}

// swagger:parameters updateEventAction
type UpdateEventActionParams struct {
	// in:path
	EventActionId int64 `json:"eventActionId"`
	// in:body
	Body eventactions.EventActionDetailsDTO
}

// swagger:parameters deleteEventAction
type DeleteEventActionParams struct {
	// in:path
	EventActionId int64 `json:"eventActionId"`
}

// swagger:response searchOrgEventActionsWithPagingResponse
type SearchOrgEventActionsWithPagingResponse struct {
	// in:body
	Body *eventactions.SearchEventActionsResult
}

// swagger:response createEventActionResponse
type CreateEventActionResponse struct {
	// in:body
	Body *eventactions.EventActionDTO
}

// swagger:response retrieveEventActionResponse
type RetrieveEventActionResponse struct {
	// in:body
	Body *eventactions.EventActionDTO
}

// swagger:response updateEventActionResponse
type UpdateEventActionResponse struct {
	// in:body
	Body struct {
		Message     string                              `json:"message"`
		ID          int64                               `json:"id"`
		Name        string                              `json:"name"`
		EventAction *eventactions.EventActionDetailsDTO `json:"eventaction"`
	}
}
