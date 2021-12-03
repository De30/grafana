package accesscontrol

import (
	"context"
	"fmt"
	"regexp"
	"strings"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

type AccessControl interface {
	// Evaluate evaluates access to the given resources.
	Evaluate(ctx context.Context, user *models.SignedInUser, evaluator Evaluator) (bool, error)

	// GetUserPermissions returns user permissions.
	GetUserPermissions(ctx context.Context, user *models.SignedInUser) ([]*Permission, error)

	// GetUserRoles returns user roles.
	GetUserRoles(ctx context.Context, user *models.SignedInUser) ([]*RoleDTO, error)

	//IsDisabled returns if access control is enabled or not
	IsDisabled() bool

	// DeclareFixedRoles allow the caller to declare, to the service, fixed roles and their
	// assignments to organization roles ("Viewer", "Editor", "Admin") or "Grafana Admin"
	DeclareFixedRoles(...RoleRegistration) error
}

type PermissionsProvider interface {
	GetUserPermissions(ctx context.Context, query GetUserPermissionsQuery) ([]*Permission, error)
}

type ResourceStore interface {
	// SetUserResourcePermissions sets permissions for managed user role on a resource
	SetUserResourcePermissions(ctx context.Context, orgID, userID int64, cmd SetResourcePermissionsCommand) ([]ResourcePermission, error)
	// SetTeamResourcePermissions sets permissions for managed team role on a resource
	SetTeamResourcePermissions(ctx context.Context, orgID, teamID int64, cmd SetResourcePermissionsCommand) ([]ResourcePermission, error)
	// SetBuiltinResourcePermissions sets permissions for managed builtin role on a resource
	SetBuiltinResourcePermissions(ctx context.Context, orgID int64, builtinRole string, cmd SetResourcePermissionsCommand) ([]ResourcePermission, error)
	// RemoveResourcePermission remove permission for resource
	RemoveResourcePermission(ctx context.Context, orgID int64, cmd RemoveResourcePermissionCommand) error
	// GetResourcesPermissions will return all permission for all supplied resource ids
	GetResourcesPermissions(ctx context.Context, orgID int64, query GetResourcesPermissionsQuery) ([]ResourcePermission, error)
}

// Metadata contains user accesses for a given resource
// Ex: map[string]bool{"create":true, "delete": true}
type Metadata map[string]bool

// SwitchUserOrg changes a SignedInUser organization and fetches the user's role in it.
func SwitchUserOrg(ctx context.Context, db *sqlstore.SQLStore, user models.SignedInUser, orgID int64) (*models.SignedInUser, error) {
	if orgID == GlobalOrgID {
		user.OrgId = orgID
		user.OrgName = ""
		user.OrgRole = ""
	} else {
		query := models.GetSignedInUserQuery{UserId: user.UserId, OrgId: orgID}
		if err := db.GetSignedInUserWithCacheCtx(ctx, &query); err != nil {
			return nil, fmt.Errorf("failed to authenticate user in target org: %w", err)
		}
		user.OrgId = query.Result.OrgId
		user.OrgName = query.Result.OrgName
		user.OrgRole = query.Result.OrgRole
	}
	return &user, nil
}

// HasGlobalAccess checks user access with globally assigned permissions only
func HasGlobalAccess(ac AccessControl, c *models.ReqContext) func(fallback func(*models.ReqContext) bool, evaluator Evaluator) bool {
	return func(fallback func(*models.ReqContext) bool, evaluator Evaluator) bool {
		if ac.IsDisabled() {
			return fallback(c)
		}

		userCopy, _ := SwitchUserOrg(c.Req.Context(), nil, *c.SignedInUser, GlobalOrgID)
		hasAccess, err := ac.Evaluate(c.Req.Context(), userCopy, evaluator)
		if err != nil {
			c.Logger.Error("Error from access control system", "error", err)
			return false
		}

		return hasAccess
	}
}

func HasAccess(ac AccessControl, c *models.ReqContext) func(fallback func(*models.ReqContext) bool, evaluator Evaluator) bool {
	return func(fallback func(*models.ReqContext) bool, evaluator Evaluator) bool {
		if ac.IsDisabled() {
			return fallback(c)
		}

		hasAccess, err := ac.Evaluate(c.Req.Context(), c.SignedInUser, evaluator)
		if err != nil {
			c.Logger.Error("Error from access control system", "error", err)
			return false
		}

		return hasAccess
	}
}

var ReqGrafanaAdmin = func(c *models.ReqContext) bool {
	return c.IsGrafanaAdmin
}

var ReqOrgAdmin = func(c *models.ReqContext) bool {
	return c.OrgRole == models.ROLE_ADMIN
}

func BuildPermissionsMap(permissions []*Permission) map[string]bool {
	permissionsMap := make(map[string]bool)
	for _, p := range permissions {
		permissionsMap[p.Action] = true
	}

	return permissionsMap
}

// GroupScopesByAction will group scopes on action
func GroupScopesByAction(permissions []*Permission) map[string]map[string]struct{} {
	m := make(map[string]map[string]struct{})
	for _, p := range permissions {
		if _, ok := m[p.Action]; ok {
			m[p.Action][p.Scope] = struct{}{}
		} else {
			m[p.Action] = map[string]struct{}{p.Scope: {}}
		}
	}
	return m
}

func ValidateScope(scope string) bool {
	prefix, last := scope[:len(scope)-1], scope[len(scope)-1]
	// verify that last char is either ':' or '/' if last character of scope is '*'
	if len(prefix) > 0 && last == '*' {
		lastChar := prefix[len(prefix)-1]
		if lastChar != ':' && lastChar != '/' {
			return false
		}
	}
	return !strings.ContainsAny(prefix, "*?")
}

// TODO remove this implementation in favor of the other one
// GetResourcesMetadataV1 returns a map of accesscontrol metadata, listing for each resource, users available actions
func GetResourcesMetadataV1(ctx context.Context, permissions []*Permission, resource string, resourceIDs []string) (map[string]Metadata, error) {
	allScope := GetResourceAllScope(resource)
	allIDScope := GetResourceAllIDScope(resource)

	result := map[string]Metadata{}
	for _, r := range resourceIDs {
		scope := GetResourceScope(resource, r)
		for _, p := range permissions {
			if p.Scope == "*" || p.Scope == allScope || p.Scope == allIDScope || p.Scope == scope {
				metadata, initialized := result[r]
				if !initialized {
					metadata = Metadata{}
				}
				metadata[p.Action] = true
				result[r] = metadata
			}
		}
	}

	return result, nil
}

func getResourceAllScopeRegex(resource string) string {
	return fmt.Sprintf("(%s[:][*])", resource)
}

func getResourceAllIDScopeRegex(resource string) string {
	return fmt.Sprintf("(%s[:]id[:][*])", resource)
}

func getResourceScopeRegex(resource, target string) string {
	return fmt.Sprintf("^(%s[:]id[:](%s))$", resource, target)
}

func addActionToMetadata(allMetadata map[string]Metadata, action, id string) map[string]Metadata {
	metadata, initialized := allMetadata[id]
	if !initialized {
		metadata = Metadata{}
	}
	metadata[action] = true
	allMetadata[id] = metadata
	return allMetadata
}

// GetResourcesMetadata returns a map of accesscontrol metadata, listing for each resource, users available actions
func GetResourcesMetadata(ctx context.Context, permissions []*Permission, resource string, resourceIDs []string) (map[string]Metadata, error) {
	allScope := getResourceAllScopeRegex(resource)
	allIDScope := getResourceAllIDScopeRegex(resource)

	// Regex to match global scopes
	globalsFilter, err := regexp.Compile(fmt.Sprintf("^([*]|%s|%s)$", allScope, allIDScope))
	if err != nil {
		return nil, err
	}

	// Regex to match all resource scopes
	allIds := strings.Join(resourceIDs, "|")
	resourcesFilter, err := regexp.Compile(getResourceScopeRegex(resource, allIds))
	if err != nil {
		return nil, err
	}

	// Loop through permissions once adding id specific actions and saving global actions for later
	result := map[string]Metadata{}
	globalAction := map[string]bool{}
	for _, p := range permissions {
		scope := []byte(p.Scope)
		if globalsFilter.Match(scope) {
			globalAction[p.Action] = true
		} else if match := resourcesFilter.FindStringSubmatch(p.Scope); match != nil {
			result = addActionToMetadata(result, p.Action, match[2])
		}
	}

	// Add global permissions to all resources
	for _, id := range resourceIDs {
		for action := range globalAction {
			result = addActionToMetadata(result, action, id)
		}
	}

	return result, nil
}

// GetOrgsMetadata returns a map of accesscontrol metadata, listing for each org, users available actions
func GetOrgsMetadata(ctx context.Context, ac AccessControl, db *sqlstore.SQLStore, user *models.SignedInUser, orgIDs []int64) (map[string]Metadata, error) {
	// Define filtering regexp
	actionFilter, err := regexp.Compile("^orgs[.:].*")
	if err != nil {
		return nil, fmt.Errorf("could not parse actions for orgs: %w", err)
	}

	result := map[string]Metadata{}
	for _, id := range orgIDs {
		userCopy, err := SwitchUserOrg(ctx, db, *user, id)
		if err != nil {
			continue
		}
		permissions, err := ac.GetUserPermissions(ctx, userCopy)
		if err != nil {
			continue
		}
		// Search for orgs related actions
		for _, p := range permissions {
			if actionFilter.Match([]byte(p.Action)) {
				result = addActionToMetadata(result, p.Action, fmt.Sprintf("%d", id))
			}
		}
	}
	return result, nil
}
