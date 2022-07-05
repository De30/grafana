package plugins

import (
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
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
	ScopeProvider = ac.NewScopeProvider("plugins")
)

func DeclareRBACRoles(acService ac.AccessControl) error {
	// FIXME: come up with a proper name
	AppPluginsReader := ac.RoleRegistration{
		Role: ac.RoleDTO{
			Name:        ac.FixedRolePrefix + "plugins.app:reader",
			DisplayName: "Application Plugins Access",
			Description: "Grant access to Application plugins (still enforcing the organization role)",
			Group:       "Plugins",
			Permissions: []ac.Permission{
				{Action: ActionAppAccess, Scope: ScopeProvider.GetResourceAllScope()},
				{Action: ActionSettingsRead, Scope: ScopeProvider.GetResourceAllScope()},
			},
		},
		Grants: []string{string(models.ROLE_VIEWER)},
	}
	PluginsWriter := ac.RoleRegistration{
		Role: ac.RoleDTO{
			Name:        ac.FixedRolePrefix + "plugins.app:reader",
			DisplayName: "Plugin Access",
			Description: "Enable and disable plugins, view and edit plugins' settings",
			Group:       "Plugins",
			Permissions: []ac.Permission{
				{Action: ActionToggle, Scope: ScopeProvider.GetResourceAllScope()},
				{Action: ActionSettingsRead, Scope: ScopeProvider.GetResourceAllScope()},
				{Action: ActionSettingsWrite, Scope: ScopeProvider.GetResourceAllScope()},
			},
		},
		Grants: []string{string(models.ROLE_ADMIN)},
	}
	PluginsManager := ac.RoleRegistration{
		Role: ac.RoleDTO{
			Name:        ac.FixedRolePrefix + "plugins.app:reader",
			DisplayName: "Plugin Access",
			Description: "Install, uninstall, enable, disable plugins",
			Group:       "Plugins",
			Permissions: []ac.Permission{
				{Action: ActionIntall},
				{Action: ActionToggle, Scope: ScopeProvider.GetResourceAllScope()},
			},
		},
		Grants: []string{ac.RoleGrafanaAdmin},
	}
	return acService.DeclareFixedRoles(AppPluginsReader, PluginsWriter, PluginsManager)
}
