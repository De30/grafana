package orgimpl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/grafana/grafana/pkg/events"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
)

const MainOrgName = "Main Org."

type store interface {
	Get(context.Context, int64) (*org.Org, error)
	Insert(context.Context, *org.Org) (int64, error)
	InsertOrgUser(context.Context, *user.OrgUser) (int64, error)
	DeleteUserFromAll(context.Context, int64) error
	CreateOrg(context.Context, *org.CreateOrgCommand) error
	CreateOrgWithMember(ctx context.Context, name string, userID int64) (org.Org, error)
	UpdateOrg(ctx context.Context, cmd *org.UpdateOrgCommand) error
	UpdateOrgAddress(context.Context, *org.UpdateOrgAddressCommand) error
	DeleteOrg(context.Context, *org.DeleteOrgCommand) error
	GetOrgByNameHandler(context.Context, *org.GetOrgByNameQuery) error
	GetOrgById(context.Context, *org.GetOrgByIdQuery) error
	SearchOrgs(context.Context, *org.SearchOrgsQuery) error
	AddOrgUser(context.Context, *org.AddOrgUserCommand) error
	UpdateOrgUser(context.Context, *org.UpdateOrgUserCommand) error
	SearchOrgUsers(context.Context, *org.SearchOrgUsersQuery) error
	GetOrgUsers(context.Context, *org.GetOrgUsersQuery) error
	RemoveOrgUser(context.Context, *org.RemoveOrgUserCommand) error
}

type sqlStore struct {
	db      db.DB
	dialect migrator.Dialect
	cfg     *setting.Cfg
	log     log.Logger
}

func (ss *sqlStore) Get(ctx context.Context, orgID int64) (*org.Org, error) {
	var orga org.Org
	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		has, err := sess.Where("id=?", orgID).Get(&orga)
		if err != nil {
			return err
		}
		if !has {
			return org.ErrOrgNotFound
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return &orga, nil
}

func (ss *sqlStore) Insert(ctx context.Context, org *org.Org) (int64, error) {
	var orgID int64
	var err error
	err = ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if orgID, err = sess.InsertOne(org); err != nil {
			return err
		}
		if org.ID != 0 {
			// it sets the setval in the sequence
			if err := ss.dialect.PostInsertId("org", sess.Session); err != nil {
				return err
			}
		}
		sess.PublishAfterCommit(&events.OrgCreated{
			Timestamp: org.Created,
			Id:        org.ID,
			Name:      org.Name,
		})
		return nil
	})
	if err != nil {
		return 0, err
	}
	return orgID, nil
}

func (ss *sqlStore) InsertOrgUser(ctx context.Context, cmd *user.OrgUser) (int64, error) {
	var orgID int64
	var err error
	err = ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if orgID, err = sess.Insert(cmd); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return 0, err
	}
	return orgID, nil
}

func (ss *sqlStore) DeleteUserFromAll(ctx context.Context, userID int64) error {
	return ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if _, err := sess.Exec("DELETE FROM org_user WHERE user_id = ?", userID); err != nil {
			return err
		}
		return nil
	})
}

func (ss *sqlStore) CreateOrg(ctx context.Context, cmd *org.CreateOrgCommand) error {
	org, err := ss.createOrg(ctx, cmd.Name, cmd.UserID)
	if err != nil {
		return err
	}
	cmd.Result = org
	return nil
}

// CreateOrgWithMember creates an organization with a certain name and a certain user as member.
func (ss *sqlStore) CreateOrgWithMember(ctx context.Context, name string, userID int64) (org.Org, error) {
	return ss.createOrg(ctx, name, userID)
}

func (ss *sqlStore) createOrg(ctx context.Context, name string, userID int64) (org.Org, error) {
	orga := org.Org{
		Name:    name,
		Created: time.Now(),
		Updated: time.Now(),
	}
	if err := ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if isNameTaken, err := isOrgNameTaken(name, 0, sess); err != nil {
			return err
		} else if isNameTaken {
			return models.ErrOrgNameTaken
		}

		if _, err := sess.Insert(&orga); err != nil {
			return err
		}

		user := user.OrgUser{
			OrgID:   orga.ID,
			UserID:  userID,
			Role:    user.RoleAdmin,
			Created: time.Now(),
			Updated: time.Now(),
		}

		_, err := sess.Insert(&user)

		sess.PublishAfterCommit(&events.OrgCreated{
			Timestamp: orga.Created,
			Id:        orga.ID,
			Name:      orga.Name,
		})

		return err
	}); err != nil {
		return orga, err
	}

	return orga, nil
}

func (ss *sqlStore) UpdateOrg(ctx context.Context, cmd *org.UpdateOrgCommand) error {
	return ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if isNameTaken, err := isOrgNameTaken(cmd.Name, cmd.OrgId, sess); err != nil {
			return err
		} else if isNameTaken {
			return models.ErrOrgNameTaken
		}

		org := org.Org{
			Name:    cmd.Name,
			Updated: time.Now(),
		}

		affectedRows, err := sess.ID(cmd.OrgId).Update(&org)

		if err != nil {
			return err
		}

		if affectedRows == 0 {
			return models.ErrOrgNotFound
		}

		sess.PublishAfterCommit(&events.OrgUpdated{
			Timestamp: org.Updated,
			Id:        org.ID,
			Name:      org.Name,
		})

		return nil
	})
}

func isOrgNameTaken(name string, existingId int64, sess *sqlstore.DBSession) (bool, error) {
	// check if org name is taken
	var org models.Org
	exists, err := sess.Where("name=?", name).Get(&org)

	if err != nil {
		return false, nil
	}

	if exists && existingId != org.Id {
		return true, nil
	}

	return false, nil
}

func (ss *sqlStore) SearchOrgs(ctx context.Context, query *org.SearchOrgsQuery) error {
	return ss.db.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		query.Result = make([]*org.OrgDTO, 0)
		sess := dbSession.Table("org")
		if query.Query != "" {
			sess.Where("name LIKE ?", query.Query+"%")
		}
		if query.Name != "" {
			sess.Where("name=?", query.Name)
		}

		if len(query.Ids) > 0 {
			sess.In("id", query.Ids)
		}

		if query.Limit > 0 {
			sess.Limit(query.Limit, query.Limit*query.Page)
		}

		sess.Cols("id", "name")
		err := sess.Find(&query.Result)
		return err
	})
}

func (ss *sqlStore) GetOrgById(ctx context.Context, query *org.GetOrgByIdQuery) error {
	return ss.db.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		var org org.Org
		exists, err := dbSession.ID(query.Id).Get(&org)
		if err != nil {
			return err
		}

		if !exists {
			return models.ErrOrgNotFound
		}

		query.Result = &org
		return nil
	})
}

func (ss *sqlStore) GetOrgByNameHandler(ctx context.Context, query *org.GetOrgByNameQuery) error {
	return ss.db.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		var org org.Org
		exists, err := dbSession.Where("name=?", query.Name).Get(&org)
		if err != nil {
			return err
		}

		if !exists {
			return models.ErrOrgNotFound
		}

		query.Result = &org
		return nil
	})
}

func (ss *sqlStore) UpdateOrgAddress(ctx context.Context, cmd *org.UpdateOrgAddressCommand) error {
	return ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		org := org.Org{
			Address1: cmd.Address1,
			Address2: cmd.Address2,
			City:     cmd.City,
			ZipCode:  cmd.ZipCode,
			State:    cmd.State,
			Country:  cmd.Country,

			Updated: time.Now(),
		}

		if _, err := sess.ID(cmd.OrgId).Update(&org); err != nil {
			return err
		}

		sess.PublishAfterCommit(&events.OrgUpdated{
			Timestamp: org.Updated,
			Id:        org.ID,
			Name:      org.Name,
		})

		return nil
	})
}

func (ss *sqlStore) DeleteOrg(ctx context.Context, cmd *org.DeleteOrgCommand) error {
	return ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if res, err := sess.Query("SELECT 1 from org WHERE id=?", cmd.Id); err != nil {
			return err
		} else if len(res) != 1 {
			return models.ErrOrgNotFound
		}

		deletes := []string{
			"DELETE FROM star WHERE EXISTS (SELECT 1 FROM dashboard WHERE org_id = ? AND star.dashboard_id = dashboard.id)",
			"DELETE FROM dashboard_tag WHERE EXISTS (SELECT 1 FROM dashboard WHERE org_id = ? AND dashboard_tag.dashboard_id = dashboard.id)",
			"DELETE FROM dashboard WHERE org_id = ?",
			"DELETE FROM api_key WHERE org_id = ?",
			"DELETE FROM data_source WHERE org_id = ?",
			"DELETE FROM org_user WHERE org_id = ?",
			"DELETE FROM org WHERE id = ?",
			"DELETE FROM temp_user WHERE org_id = ?",
			"DELETE FROM ngalert_configuration WHERE org_id = ?",
			"DELETE FROM alert_configuration WHERE org_id = ?",
			"DELETE FROM alert_instance WHERE rule_org_id = ?",
			"DELETE FROM alert_notification WHERE org_id = ?",
			"DELETE FROM alert_notification_state WHERE org_id = ?",
			"DELETE FROM alert_rule WHERE org_id = ?",
			"DELETE FROM alert_rule_tag WHERE EXISTS (SELECT 1 FROM alert WHERE alert.org_id = ? AND alert.id = alert_rule_tag.alert_id)",
			"DELETE FROM alert_rule_version WHERE rule_org_id = ?",
			"DELETE FROM alert WHERE org_id = ?",
			"DELETE FROM annotation WHERE org_id = ?",
			"DELETE FROM kv_store WHERE org_id = ?",
		}

		for _, sql := range deletes {
			_, err := sess.Exec(sql, cmd.Id)
			if err != nil {
				return err
			}
		}

		return nil
	})
}

func notServiceAccountFilter(db db.DB) string {
	return fmt.Sprintf("%s.is_service_account = %s",
		db.GetDialect().Quote("user"),
		db.GetDialect().BooleanStr(false))
}

func (ss *sqlStore) AddOrgUser(ctx context.Context, cmd *org.AddOrgUserCommand) error {
	return ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		// check if user exists
		var usr user.User
		session := sess.ID(cmd.UserId)
		if !cmd.AllowAddingServiceAccount {
			session = session.Where(notServiceAccountFilter(ss.db))
		}

		if exists, err := session.Get(&usr); err != nil {
			return err
		} else if !exists {
			return user.ErrUserNotFound
		}

		if res, err := sess.Query("SELECT 1 from org_user WHERE org_id=? and user_id=?", cmd.OrgId, usr.ID); err != nil {
			return err
		} else if len(res) == 1 {
			return models.ErrOrgUserAlreadyAdded
		}

		if res, err := sess.Query("SELECT 1 from org WHERE id=?", cmd.OrgId); err != nil {
			return err
		} else if len(res) != 1 {
			return models.ErrOrgNotFound
		}

		entity := models.OrgUser{
			OrgId:   cmd.OrgId,
			UserId:  cmd.UserId,
			Role:    cmd.Role,
			Created: time.Now(),
			Updated: time.Now(),
		}

		_, err := sess.Insert(&entity)
		if err != nil {
			return err
		}

		var userOrgs []*models.UserOrgDTO
		sess.Table("org_user")
		sess.Join("INNER", "org", "org_user.org_id=org.id")
		sess.Where("org_user.user_id=? AND org_user.org_id=?", usr.ID, usr.OrgID)
		sess.Cols("org.name", "org_user.role", "org_user.org_id")
		err = sess.Find(&userOrgs)

		if err != nil {
			return err
		}

		if len(userOrgs) == 0 {
			return setUsingOrgInTransaction(sess, usr.ID, cmd.OrgId)
		}

		return nil
	})
}

func (ss *sqlStore) UpdateOrgUser(ctx context.Context, cmd *org.UpdateOrgUserCommand) error {
	return ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		var orgUser user.OrgUser
		exists, err := sess.Where("org_id=? AND user_id=?", cmd.OrgId, cmd.UserId).Get(&orgUser)
		if err != nil {
			return err
		}

		if !exists {
			return models.ErrOrgUserNotFound
		}

		orgUser.Role = cmd.Role
		orgUser.Updated = time.Now()
		_, err = sess.ID(orgUser.ID).Update(&orgUser)
		if err != nil {
			return err
		}

		return validateOneAdminLeftInOrg(cmd.OrgId, sess)
	})
}

// validate that there is an org admin user left
func validateOneAdminLeftInOrg(orgId int64, sess *sqlstore.DBSession) error {
	res, err := sess.Query("SELECT 1 from org_user WHERE org_id=? and role='Admin'", orgId)
	if err != nil {
		return err
	}

	if len(res) == 0 {
		return models.ErrLastOrgAdmin
	}

	return err
}

func (ss *sqlStore) SearchOrgUsers(ctx context.Context, query *org.SearchOrgUsersQuery) error {
	return ss.db.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		query.Result = org.SearchOrgUsersQueryResult{
			OrgUsers: make([]*org.OrgUserDTO, 0),
		}

		sess := dbSession.Table("org_user")
		dialect := ss.db.GetDialect()
		sess.Join("INNER", dialect.Quote("user"), fmt.Sprintf("org_user.user_id=%s.id", dialect.Quote("user")))

		whereConditions := make([]string, 0)
		whereParams := make([]interface{}, 0)

		whereConditions = append(whereConditions, "org_user.org_id = ?")
		whereParams = append(whereParams, query.OrgID)

		whereConditions = append(whereConditions, fmt.Sprintf("%s.is_service_account = %s", dialect.Quote("user"), dialect.BooleanStr(false)))

		if !accesscontrol.IsDisabled(ss.cfg) {
			acFilter, err := accesscontrol.Filter(query.User, "org_user.user_id", "users:id:", accesscontrol.ActionOrgUsersRead)
			if err != nil {
				return err
			}
			whereConditions = append(whereConditions, acFilter.Where)
			whereParams = append(whereParams, acFilter.Args...)
		}

		if query.Query != "" {
			queryWithWildcards := "%" + query.Query + "%"
			whereConditions = append(whereConditions, "(email "+dialect.LikeStr()+" ? OR name "+dialect.LikeStr()+" ? OR login "+dialect.LikeStr()+" ?)")
			whereParams = append(whereParams, queryWithWildcards, queryWithWildcards, queryWithWildcards)
		}

		if len(whereConditions) > 0 {
			sess.Where(strings.Join(whereConditions, " AND "), whereParams...)
		}

		if query.Limit > 0 {
			offset := query.Limit * (query.Page - 1)
			sess.Limit(query.Limit, offset)
		}

		sess.Cols(
			"org_user.org_id",
			"org_user.user_id",
			"user.email",
			"user.name",
			"user.login",
			"org_user.role",
			"user.last_seen_at",
		)
		sess.Asc("user.email", "user.login")

		if err := sess.Find(&query.Result.OrgUsers); err != nil {
			return err
		}

		// get total count
		orgUser := models.OrgUser{}
		countSess := dbSession.Table("org_user").
			Join("INNER", dialect.Quote("user"), fmt.Sprintf("org_user.user_id=%s.id", dialect.Quote("user")))

		if len(whereConditions) > 0 {
			countSess.Where(strings.Join(whereConditions, " AND "), whereParams...)
		}

		count, err := countSess.Count(&orgUser)
		if err != nil {
			return err
		}
		query.Result.TotalCount = count

		for _, user := range query.Result.OrgUsers {
			user.LastSeenAtAge = util.GetAgeString(user.LastSeenAt)
		}

		return nil
	})
}

func (ss *sqlStore) GetOrgUsers(ctx context.Context, query *org.GetOrgUsersQuery) error {
	return ss.db.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		query.Result = make([]*org.OrgUserDTO, 0)

		sess := dbSession.Table("org_user")
		dialect := ss.db.GetDialect()
		sess.Join("INNER", dialect.Quote("user"), fmt.Sprintf("org_user.user_id=%s.id", dialect.Quote("user")))

		whereConditions := make([]string, 0)
		whereParams := make([]interface{}, 0)

		whereConditions = append(whereConditions, "org_user.org_id = ?")
		whereParams = append(whereParams, query.OrgId)

		if query.UserID != 0 {
			whereConditions = append(whereConditions, "org_user.user_id = ?")
			whereParams = append(whereParams, query.UserID)
		}

		whereConditions = append(whereConditions, fmt.Sprintf("%s.is_service_account = ?", dialect.Quote("user")))
		whereParams = append(whereParams, dialect.BooleanStr(false))

		if query.User == nil {
			ss.log.Warn("Query user not set for filtering.")
		}

		if !query.DontEnforceAccessControl && !accesscontrol.IsDisabled(ss.cfg) {
			acFilter, err := accesscontrol.Filter(query.User, "org_user.user_id", "users:id:", accesscontrol.ActionOrgUsersRead)
			if err != nil {
				return err
			}
			whereConditions = append(whereConditions, acFilter.Where)
			whereParams = append(whereParams, acFilter.Args...)
		}

		if query.Query != "" {
			queryWithWildcards := "%" + query.Query + "%"
			whereConditions = append(whereConditions, "(email "+dialect.LikeStr()+" ? OR name "+dialect.LikeStr()+" ? OR login "+dialect.LikeStr()+" ?)")
			whereParams = append(whereParams, queryWithWildcards, queryWithWildcards, queryWithWildcards)
		}

		if len(whereConditions) > 0 {
			sess.Where(strings.Join(whereConditions, " AND "), whereParams...)
		}

		if query.Limit > 0 {
			sess.Limit(query.Limit, 0)
		}

		sess.Cols(
			"org_user.org_id",
			"org_user.user_id",
			"user.email",
			"user.name",
			"user.login",
			"org_user.role",
			"user.last_seen_at",
			"user.created",
			"user.updated",
		)
		sess.Asc("user.email", "user.login")

		if err := sess.Find(&query.Result); err != nil {
			return err
		}

		for _, user := range query.Result {
			user.LastSeenAtAge = util.GetAgeString(user.LastSeenAt)
		}

		return nil
	})
}

func (ss *sqlStore) RemoveOrgUser(ctx context.Context, cmd *org.RemoveOrgUserCommand) error {
	return ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		// check if user exists
		var usr user.User
		if exists, err := sess.ID(cmd.UserId).Where(notServiceAccountFilter(ss.db)).Get(&usr); err != nil {
			return err
		} else if !exists {
			return user.ErrUserNotFound
		}

		deletes := []string{
			"DELETE FROM org_user WHERE org_id=? and user_id=?",
			"DELETE FROM dashboard_acl WHERE org_id=? and user_id = ?",
			"DELETE FROM team_member WHERE org_id=? and user_id = ?",
			"DELETE FROM query_history_star WHERE org_id=? and user_id = ?",
		}

		for _, sql := range deletes {
			_, err := sess.Exec(sql, cmd.OrgId, cmd.UserId)
			if err != nil {
				return err
			}
		}

		// validate that after delete, there is at least one user with admin role in org
		if err := validateOneAdminLeftInOrg(cmd.OrgId, sess); err != nil {
			return err
		}

		// check user other orgs and update user current org
		var userOrgs []*org.UserOrgDTO
		sess.Table("org_user")
		sess.Join("INNER", "org", "org_user.org_id=org.id")
		sess.Where("org_user.user_id=?", usr.ID)
		sess.Cols("org.name", "org_user.role", "org_user.org_id")
		err := sess.Find(&userOrgs)

		if err != nil {
			return err
		}

		if len(userOrgs) > 0 {
			hasCurrentOrgSet := false
			for _, userOrg := range userOrgs {
				if usr.OrgID == userOrg.OrgId {
					hasCurrentOrgSet = true
					break
				}
			}

			if !hasCurrentOrgSet {
				err = setUsingOrgInTransaction(sess, usr.ID, userOrgs[0].OrgId)
				if err != nil {
					return err
				}
			}
		} else if cmd.ShouldDeleteOrphanedUser {
			// no other orgs, delete the full user
			if err := deleteUserInTransaction(ss, sess, &models.DeleteUserCommand{UserId: usr.ID}); err != nil {
				return err
			}

			cmd.UserWasDeleted = true
		} else {
			// no orgs, but keep the user -> clean up orgId
			err = removeUserOrg(sess, usr.ID)
			if err != nil {
				return err
			}
		}

		return nil
	})
}

func (ss *sqlStore) GetUserOrgList(ctx context.Context, query *org.GetUserOrgListQuery) error
func (ss *sqlStore) SetUsingOrg(ctx context.Context, cmd *org.SetUsingOrgCommand) error
