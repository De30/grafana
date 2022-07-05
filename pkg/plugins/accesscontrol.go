package plugins

import (
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
)

const (
	// Plugins actions
	ActionIntall        = "plugins:install"
	ActionToggle        = "plugins:toggle"
	ActionSettingsRead  = "plugins.settings:read"
	ActionSettingsWrite = "plugins.settings:write"

	// App Plugins actions
	ActionAppAccess = "plugins.app:access"
)

var (
	ScopeProvider = accesscontrol.NewScopeProvider("plugins")
)

func DeclareRBACRoles(ac accesscontrol.AccessControl) error {
	// FIXME: come up with a proper name
	AppPluginsReader := accesscontrol.RoleRegistration{
		Role: accesscontrol.RoleDTO{
			Name:        accesscontrol.FixedRolePrefix + "plugins.app:reader",
			DisplayName: "Application Plugins Access",
			Description: "Grant access to Application plugins (still enforcing the organization role)",
			Group:       "Plugins",
			Permissions: []accesscontrol.Permission{
				{Action: ActionAppAccess, Scope: ScopeProvider.GetResourceAllScope()},
				{Action: ActionSettingsRead, Scope: ScopeProvider.GetResourceAllScope()},
			},
		},
		Grants: []string{string(models.ROLE_VIEWER)},
	}

	PluginsWriter := accesscontrol.RoleRegistration{
		Role: accesscontrol.RoleDTO{
			Name:        accesscontrol.FixedRolePrefix + "plugins.app:reader",
			DisplayName: "Plugin Access",
			Description: "Install, Uninstall, Enable, Disable plugins, view and edit plugins' settings",
			Group:       "Plugins",
			Permissions: []accesscontrol.Permission{
				{Action: ActionIntall},
				{Action: ActionToggle, Scope: ScopeProvider.GetResourceAllScope()},
				{Action: ActionSettingsRead, Scope: ScopeProvider.GetResourceAllScope()},
				{Action: ActionSettingsWrite, Scope: ScopeProvider.GetResourceAllScope()},
			},
		},
		Grants: []string{accesscontrol.RoleGrafanaAdmin},
	}
	return ac.DeclareFixedRoles(AppPluginsReader, PluginsWriter)
}
