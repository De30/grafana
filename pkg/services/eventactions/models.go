package eventactions

import (
	"github.com/grafana/grafana/pkg/services/accesscontrol"
)

var (
	ScopeAll = "eventactions:*"
	ScopeID  = accesscontrol.Scope("eventactions", "id", accesscontrol.Parameter(":eventActionId"))
)

const (
	ActionRead   = "eventactions:read"
	ActionWrite  = "eventactions:write"
	ActionCreate = "eventactions:create"
	ActionDelete = "eventactions:delete"

	ActionPermissionsRead  = "eventactions.permissions:read"
	ActionPermissionsWrite = "eventactions.permissions:write"
)

// swagger:model
type CreateEventActionForm struct {
	// example: grafana
	Name string `json:"name" binding:"Required"`
}

// swagger: model
type EventActionDTO struct {
	Id int64 `json:"id" xorm:"id"`
	// example: grafana
	Name string `json:"name" xorm:"name"`
	// example: 1
	OrgId int64 `json:"orgId" xorm:"org_id"`
	// example: webhook, code
	Type string `json:"type" xorm:"type"`
	// example: https://mydomain.com/webhook
	URL string `json:"url" xorm:"url"`
}

func (e *EventActionDTO) TableName() string {
	return "event_action"
}

// swagger: model
type EventActionDetailsDTO struct {
	Id int64 `json:"id" xorm:"id"`
	// example: grafana
	Name string `json:"name" xorm:"name"`
	// example: 1
	OrgId int64 `json:"orgId" xorm:"org_id"`
	// example: webhook, code
	Type string `json:"type" xorm:"type"`
	// example: https://mydomain.com/webhook
	URL string `json:"url" xorm:"url"`

	// Detailed fields
	Description    string `json:"description" xorm:"description"`
	Script         string `json:"script" xorm:"script"`
	ScriptLanguage string `json:"scriptLanguage" xorm:"script_language"`
}

func (e *EventActionDetailsDTO) TableName() string {
	return "event_action"
}

// swagger: model
type SearchEventActionsResult struct {
	// It can be used for pagination of the user list
	// E.g. if totalCount is equal to 100 users and
	// the perpage parameter is set to 10 then there are 10 pages of users.
	TotalCount   int64             `json:"totalCount"`
	EventActions []*EventActionDTO `json:"eventActions"`
	Page         int               `json:"page"`
	PerPage      int               `json:"perPage"`
}

type EventActionType string // used for filtering

const (
	ActionTypeWebhook EventActionType = "webhook"
	ActionTypeCode    EventActionType = "code"
)

// swagger:model
type EventDTO struct {
	Id int64 `json:"id" xorm:"id"`
	// example:grafana.user.added
	Name string `json:"name" xorm:"name"`
	// example:A new user has been added
	Description string `json:"description" xorm:"description"`
}

type RegisterEventForm struct {
	// example: grafana
	Name string `json:"name" binding:"Required"`
	// example:A new user has been added
	Description string `json:"description" binding:"Required"`
}
