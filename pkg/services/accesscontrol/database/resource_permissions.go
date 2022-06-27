package database

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/accesscontrol/resourcepermissions/types"
	"github.com/grafana/grafana/pkg/services/sqlstore"
)

type flatResourcePermission struct {
	ID                int64 `xorm:"id"`
	RoleName          string
	Action            string
	Scope             string
	SubjectKind       string
	SubjectIdentifier string
	Created           time.Time
	Updated           time.Time
}

func (p *flatResourcePermission) IsManaged(scope string) bool {
	return strings.HasPrefix(p.RoleName, accesscontrol.ManagedRolePrefix) && !p.IsInherited(scope)
}

func (p *flatResourcePermission) IsInherited(scope string) bool {
	return p.Scope != scope
}

func (s *AccessControlStore) SetResourcePermission(
	ctx context.Context, orgID int64, binding accesscontrol.Binding,
	cmd types.SetResourcePermissionCommand, hook types.ResourceHookFunc,
) (*accesscontrol.ResourcePermission, error) {
	var err error
	var permission *accesscontrol.ResourcePermission
	err = s.sql.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		permission, err = s.setResourcePermission(sess, orgID, managedRoleName(binding), roleBinder(sess, orgID, binding), cmd)
		if err != nil {
			return err
		}

		if hook != nil {
			if err := hook(sess, orgID, binding, cmd.ResourceID, cmd.Permission); err != nil {
				return err
			}
		}
		return err
	})
	if err != nil {
		return nil, err
	}
	return permission, nil
}

func (s *AccessControlStore) SetResourcePermissions(
	ctx context.Context, orgID int64,
	commands []types.SetResourcePermissionsCommand,
	hooks types.ResourceHooks,
) ([]accesscontrol.ResourcePermission, error) {
	var err error
	var permissions []accesscontrol.ResourcePermission

	err = s.sql.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		for _, cmd := range commands {
			p, err := s.setResourcePermission(sess, orgID, managedRoleName(cmd.Binding), roleBinder(sess, orgID, cmd.Binding), cmd.SetResourcePermissionCommand)
			if err != nil {
				return err
			}
			if cmd.Hook != nil {
				if err := cmd.Hook(sess, orgID, cmd.Binding, cmd.ResourceID, cmd.Permission); err != nil {
					return err
				}
			}
			if p != nil {
				permissions = append(permissions, *p)
			}
		}

		return nil
	})

	return permissions, err
}

type roleAdder func(roleID int64) error

func (s *AccessControlStore) setResourcePermission(
	sess *sqlstore.DBSession, orgID int64, roleName string, adder roleAdder, cmd types.SetResourcePermissionCommand,
) (*accesscontrol.ResourcePermission, error) {
	role, err := s.getOrCreateManagedRole(sess, orgID, roleName, adder)
	if err != nil {
		return nil, err
	}

	rawSQL := `
	SELECT
		p.*
	FROM permission as p
		INNER JOIN role r on r.id = p.role_id
	WHERE r.id = ?
		AND p.scope = ?
	`

	var current []accesscontrol.Permission
	scope := accesscontrol.Scope(cmd.Resource, cmd.ResourceAttribute, cmd.ResourceID)
	if err := sess.SQL(rawSQL, role.ID, scope).Find(&current); err != nil {
		return nil, err
	}

	missing := make(map[string]struct{}, len(cmd.Actions))
	for _, a := range cmd.Actions {
		missing[a] = struct{}{}
	}

	var keep []int64
	var remove []int64
	for _, p := range current {
		if _, ok := missing[p.Action]; ok {
			keep = append(keep, p.ID)
			delete(missing, p.Action)
		} else if !ok {
			remove = append(remove, p.ID)
		}
	}

	if err := deletePermissions(sess, remove); err != nil {
		return nil, err
	}

	for action := range missing {
		id, err := s.createResourcePermission(sess, role.ID, action, cmd.Resource, cmd.ResourceID, cmd.ResourceAttribute)
		if err != nil {
			return nil, err
		}
		keep = append(keep, id)
	}

	permissions, err := s.getResourcePermissionsByIds(sess, cmd.Resource, cmd.ResourceID, cmd.ResourceAttribute, keep)
	if err != nil {
		return nil, err
	}

	permission := flatPermissionsToResourcePermission(scope, permissions)
	if permission == nil {
		return &accesscontrol.ResourcePermission{}, nil
	}

	return permission, nil
}

func (s *AccessControlStore) GetResourcePermissions(ctx context.Context, orgID int64, query types.GetResourcePermissionsQuery) ([]accesscontrol.ResourcePermission, error) {
	var result []accesscontrol.ResourcePermission

	err := s.sql.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		var err error
		result, err = s.getResourcePermissions(sess, orgID, query)
		return err
	})

	return result, err
}

func (s *AccessControlStore) createResourcePermission(sess *sqlstore.DBSession, roleID int64, action, resource, resourceID, resourceAttribute string) (int64, error) {
	permission := managedPermission(action, resource, resourceID, resourceAttribute)
	permission.RoleID = roleID
	permission.Created = time.Now()
	permission.Updated = time.Now()

	if _, err := sess.Insert(&permission); err != nil {
		return 0, err
	}
	return permission.ID, nil
}

func (s *AccessControlStore) getResourcePermissions(sess *sqlstore.DBSession, orgID int64, query types.GetResourcePermissionsQuery) ([]accesscontrol.ResourcePermission, error) {
	if len(query.Actions) == 0 {
		return nil, nil
	}

	sql := `
	SELECT
		p.*,
		rb.subject_kind,
		rb.subject_identifier
	FROM permission p
		INNER JOIN role r on r.id = p.role_id
		INNER JOIN role_binding rb on r.id = rb.role_id
	WHERE (rb.org_id = 0 OR rb.org_id = ?)
 	AND (p.scope = '*' OR p.scope = ? OR p.scope = ? OR p.scope = ?
	`
	var params []interface{}
	scope := accesscontrol.Scope(query.Resource, query.ResourceAttribute, query.ResourceID)
	params = append(
		params,
		orgID,
		accesscontrol.Scope(query.Resource, "*"),
		accesscontrol.Scope(query.Resource, query.ResourceAttribute, "*"),
		scope,
	)

	if len(query.InheritedScopes) > 0 {
		sql += ` OR p.scope IN(?` + strings.Repeat(",?", len(query.InheritedScopes)-1) + `)`
		for _, scope := range query.InheritedScopes {
			params = append(params, scope)
		}
	}

	sql += `) AND p.action IN (?` + strings.Repeat(",?", len(query.Actions)-1) + `)`

	for _, a := range query.Actions {
		params = append(params, a)
	}

	if query.OnlyManaged {
		sql += `AND r.name LIKE 'managed:%'`
	}

	queryResults := make([]flatResourcePermission, 0)
	if err := sess.SQL(sql, params...).Find(&queryResults); err != nil {
		return nil, err
	}

	var result []accesscontrol.ResourcePermission
	byKind := groupPermissionsByKind(queryResults)

	for _, kind := range byKind {
		for _, p := range kind {
			result = append(result, flatPermissionsToResourcePermissions(scope, p)...)
		}
	}

	return result, nil
}

// TODO : Group by kind (better aggregation)
func groupPermissionsByKind(permissions []flatResourcePermission) map[string]map[string][]flatResourcePermission {
	byKind := make(map[string]map[string][]flatResourcePermission, 3)
	for _, p := range permissions {
		if _, ok := byKind[p.SubjectKind]; !ok {
			byKind[p.SubjectKind] = make(map[string][]flatResourcePermission)
		}
		byKind[p.SubjectKind][p.SubjectIdentifier] = append(byKind[p.SubjectKind][p.SubjectIdentifier], p)
	}
	return byKind
}

func flatPermissionsToResourcePermissions(scope string, permissions []flatResourcePermission) []accesscontrol.ResourcePermission {
	var managed, provisioned []flatResourcePermission
	for _, p := range permissions {
		if p.IsManaged(scope) {
			managed = append(managed, p)
		} else {
			provisioned = append(provisioned, p)
		}
	}

	var result []accesscontrol.ResourcePermission
	if g := flatPermissionsToResourcePermission(scope, managed); g != nil {
		result = append(result, *g)
	}
	if g := flatPermissionsToResourcePermission(scope, provisioned); g != nil {
		result = append(result, *g)
	}

	return result
}

func flatPermissionsToResourcePermission(scope string, permissions []flatResourcePermission) *accesscontrol.ResourcePermission {
	if len(permissions) == 0 {
		return nil
	}

	actions := make([]string, 0, len(permissions))
	for _, p := range permissions {
		actions = append(actions, p.Action)
	}

	first := permissions[0]
	return &accesscontrol.ResourcePermission{
		ID:                first.ID,
		RoleName:          first.RoleName,
		Actions:           actions,
		Scope:             first.Scope,
		SubjectKind:       first.SubjectKind,
		SubjectIdentifier: first.SubjectIdentifier,
		IsManaged:         first.IsManaged(scope),
		Created:           first.Created,
		Updated:           first.Updated,
	}
}

func roleBinder(sess *sqlstore.DBSession, orgID int64, binding accesscontrol.Binding) roleAdder {
	return func(roleID int64) error {
		if res, err := sess.Query(
			"SELECT 1 FROM role_binding WHERE org_id = ? AND subject_kind = ? AND subject_identifier = ? AND role_id = ?",
			orgID, binding.SubjectKind(), binding.SubjectIdentifier(), roleID,
		); err != nil {
			return err
		} else if len(res) == 1 {
			return fmt.Errorf("role is already added to this team")
		}

		binding := &accesscontrol.RoleBinding{
			OrgID:             orgID,
			RoleID:            roleID,
			Created:           time.Now(),
			SubjectKind:       binding.SubjectKind(),
			SubjectIdentifier: binding.SubjectIdentifier(),
		}

		_, err := sess.Insert(binding)
		return err
	}
}

func (s *AccessControlStore) getOrCreateManagedRole(sess *sqlstore.DBSession, orgID int64, name string, add roleAdder) (*accesscontrol.Role, error) {
	role := accesscontrol.Role{OrgID: orgID, Name: name}
	has, err := sess.Where("org_id = ? AND name = ?", orgID, name).Get(&role)

	// If managed role does not exist, create it and add it to user/team/builtin
	if !has {
		uid, err := generateNewRoleUID(sess, orgID)
		if err != nil {
			return nil, err
		}

		role = accesscontrol.Role{
			OrgID:   orgID,
			Name:    name,
			UID:     uid,
			Created: time.Now(),
			Updated: time.Now(),
		}

		if _, err := sess.Insert(&role); err != nil {
			return nil, err
		}

		if err := add(role.ID); err != nil {
			return nil, err
		}
	}

	if err != nil {
		return nil, err
	}

	return &role, nil
}

func (s *AccessControlStore) getResourcePermissionsByIds(sess *sqlstore.DBSession, resource, resourceID, resourceAttribute string, ids []int64) ([]flatResourcePermission, error) {
	var result []flatResourcePermission
	if len(ids) == 0 {
		return result, nil
	}
	rawSql := `
	SELECT
		p.*,
		rb.subject_kind,
		rb.subject_identifier
	FROM permission p
		INNER JOIN role r ON p.role_id = r.id
		INNER JOIN role_binding rb ON rb.role_id = r.id
	WHERE p.id IN (?` + strings.Repeat(",?", len(ids)-1) + `)
	`

	args := make([]interface{}, 0, len(ids)+1)
	for _, id := range ids {
		args = append(args, id)
	}

	if err := sess.SQL(rawSql, args...).Find(&result); err != nil {
		return nil, err
	}

	return result, nil
}

func managedPermission(action, resource string, resourceID, resourceAttribute string) accesscontrol.Permission {
	return accesscontrol.Permission{
		Action: action,
		Scope:  accesscontrol.Scope(resource, resourceAttribute, resourceID),
	}
}

func managedRoleName(binding accesscontrol.Binding) string {
	return fmt.Sprintf("managed:%ss:%s:permissions", binding.SubjectKind(), binding.SubjectIdentifier())
}
