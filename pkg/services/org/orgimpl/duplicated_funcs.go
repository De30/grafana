package orgimpl

import (
	"strconv"
	"strings"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/user"
)

// duplicated code
func setUsingOrgInTransaction(sess *sqlstore.DBSession, userID int64, orgID int64) error {
	user := user.User{
		ID:    userID,
		OrgID: orgID,
	}

	_, err := sess.ID(userID).Update(&user)
	return err
}

func removeUserOrg(sess *sqlstore.DBSession, userID int64) error {
	user := user.User{
		ID:    userID,
		OrgID: 0,
	}

	_, err := sess.ID(userID).MustCols("org_id").Update(&user)
	return err
}

func deleteUserInTransaction(ss *sqlStore, sess *sqlstore.DBSession, cmd *models.DeleteUserCommand) error {
	// Check if user exists
	usr := user.User{ID: cmd.UserId}
	has, err := sess.Where(notServiceAccountFilter(ss.db)).Get(&usr)
	if err != nil {
		return err
	}
	if !has {
		return user.ErrUserNotFound
	}
	for _, sql := range UserDeletions(ss.db.GetDialect()) {
		_, err := sess.Exec(sql, cmd.UserId)
		if err != nil {
			return err
		}
	}

	return deleteUserAccessControl(sess, cmd.UserId)
}

func deleteUserAccessControl(sess *sqlstore.DBSession, userID int64) error {
	// Delete user role assignments
	if _, err := sess.Exec("DELETE FROM user_role WHERE user_id = ?", userID); err != nil {
		return err
	}

	// Delete permissions that are scoped to user
	if _, err := sess.Exec("DELETE FROM permission WHERE scope = ?", accesscontrol.Scope("users", "id", strconv.FormatInt(userID, 10))); err != nil {
		return err
	}

	var roleIDs []int64
	if err := sess.SQL("SELECT id FROM role WHERE name = ?", accesscontrol.ManagedUserRoleName(userID)).Find(&roleIDs); err != nil {
		return err
	}

	if len(roleIDs) == 0 {
		return nil
	}

	query := "DELETE FROM permission WHERE role_id IN(? " + strings.Repeat(",?", len(roleIDs)-1) + ")"
	args := make([]interface{}, 0, len(roleIDs)+1)
	args = append(args, query)
	for _, id := range roleIDs {
		args = append(args, id)
	}

	// Delete managed user permissions
	if _, err := sess.Exec(args...); err != nil {
		return err
	}

	// Delete managed user roles
	if _, err := sess.Exec("DELETE FROM role WHERE name = ?", accesscontrol.ManagedUserRoleName(userID)); err != nil {
		return err
	}

	return nil
}

func UserDeletions(dialect migrator.Dialect) []string {
	deletes := []string{
		"DELETE FROM star WHERE user_id = ?",
		"DELETE FROM " + dialect.Quote("user") + " WHERE id = ?",
		"DELETE FROM org_user WHERE user_id = ?",
		"DELETE FROM dashboard_acl WHERE user_id = ?",
		"DELETE FROM preferences WHERE user_id = ?",
		"DELETE FROM team_member WHERE user_id = ?",
		"DELETE FROM user_auth WHERE user_id = ?",
		"DELETE FROM user_auth_token WHERE user_id = ?",
		"DELETE FROM quota WHERE user_id = ?",
	}
	return deletes
}
