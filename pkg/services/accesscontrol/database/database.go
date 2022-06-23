package database

import (
	"context"
	"strconv"
	"strings"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/setting"
)

const (
	globalOrgID = 0
)

func ProvideService(sqlStore *sqlstore.SQLStore) *AccessControlStore {
	return &AccessControlStore{sqlStore}
}

type AccessControlStore struct {
	sql *sqlstore.SQLStore
}

func (s *AccessControlStore) GetUserPermissions(ctx context.Context, orgID int64, user *models.SignedInUser, filter accesscontrol.GetUserPermissionsQuery) ([]accesscontrol.Permission, error) {
	result := make([]accesscontrol.Permission, 0)
	err := s.sql.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		query := `
		SELECT DISTINCT
			p.action,
			p.scope
		FROM permission p
				 INNER JOIN role r ON r.id = p.role_id
				 INNER JOIN role_binding rb ON r.id = rb.role_id
		WHERE (rb.org_id = ? OR rb.org_id = 0)
		`
		var params []interface{}
		params = append(params, orgID)

		filterQuery, filterParams := permissionFilter(user, filter)
		params = append(params, filterParams...)
		query += filterQuery + " ORDER BY p.scope"

		if err := sess.SQL(query, params...).Find(&result); err != nil {
			return err
		}

		return nil
	})

	return result, err
}

func permissionFilter(user *models.SignedInUser, filter accesscontrol.GetUserPermissionsQuery) (string, []interface{}) {
	var params []interface{}
	query := "AND ((rb.subject_kind = 'user' AND rb.subject_identifier = ?)"
	params = append(params, strconv.FormatInt(user.UserId, 10))

	if len(user.Teams) > 0 {
		query += " OR (rb.subject_kind = 'team' AND rb.subject_identifier IN (?" + strings.Repeat(", ?", len(user.Teams)-1) + "))"
		for _, t := range user.Teams {
			params = append(params, strconv.FormatInt(t, 10))
		}
	}

	// FIXME: settings
	roles := accesscontrol.GetOrgRoles(setting.NewCfg(), user)
	if len(roles) > 0 {
		query += " OR (rb.subject_kind = 'builtin' AND rb.subject_identifier IN (?" + strings.Repeat(", ?", len(roles)-1) + "))"
		for _, r := range roles {
			params = append(params, r)
		}
	}

	query += ")"
	// FIXME: actions filter

	if filter.Actions != nil {
		query += " AND p.action IN("
		if len(filter.Actions) > 0 {
			query += "?" + strings.Repeat(",?", len(filter.Actions)-1)
		}
		query += ")"
		for _, a := range filter.Actions {
			params = append(params, a)
		}
	}

	return query, params
}

func deletePermissions(sess *sqlstore.DBSession, ids []int64) error {
	if len(ids) == 0 {
		return nil
	}

	rawSQL := "DELETE FROM permission WHERE id IN(?" + strings.Repeat(",?", len(ids)-1) + ")"
	args := make([]interface{}, 0, len(ids)+1)
	args = append(args, rawSQL)
	for _, id := range ids {
		args = append(args, id)
	}

	_, err := sess.Exec(args...)
	if err != nil {
		return err
	}

	return nil
}
