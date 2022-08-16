package manager

import (
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/eventactions"
	"github.com/grafana/grafana/pkg/services/org"
)

func RegisterRoles(ac accesscontrol.AccessControl) error {
	reader := accesscontrol.RoleRegistration{
		Role: accesscontrol.RoleDTO{
			Name:        "fixed:eventactions:reader",
			DisplayName: "Event actions reader",
			Description: "Read event actions and event action tokens.",
			Group:       "Event actions",
			Permissions: []accesscontrol.Permission{
				{
					Action: eventactions.ActionRead,
					Scope:  eventactions.ScopeAll,
				},
			},
		},
		Grants: []string{string(org.RoleAdmin)},
	}

	creator := accesscontrol.RoleRegistration{
		Role: accesscontrol.RoleDTO{
			Name:        "fixed:eventactions:creator",
			DisplayName: "Event actions creator",
			Description: "Create event actions.",
			Group:       "Event actions",
			Permissions: []accesscontrol.Permission{
				{
					Action: eventactions.ActionCreate,
				},
			},
		},
		Grants: []string{string(org.RoleAdmin)},
	}

	writer := accesscontrol.RoleRegistration{
		Role: accesscontrol.RoleDTO{
			Name:        "fixed:eventactions:writer",
			DisplayName: "Event actions writer",
			Description: "Create, delete and read event actions, manage event action permissions.",
			Group:       "Event actions",
			Permissions: accesscontrol.ConcatPermissions(reader.Role.Permissions, []accesscontrol.Permission{
				{
					Action: eventactions.ActionWrite,
					Scope:  eventactions.ScopeAll,
				},
				{
					Action: eventactions.ActionCreate,
				},
				{
					Action: eventactions.ActionDelete,
					Scope:  eventactions.ScopeAll,
				},
			}),
		},
		Grants: []string{string(org.RoleAdmin)},
	}

	if err := ac.DeclareFixedRoles(reader, creator, writer); err != nil {
		return err
	}

	return nil
}
