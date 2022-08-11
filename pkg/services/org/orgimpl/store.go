package orgimpl

import (
	"context"
	"time"

	"github.com/grafana/grafana/pkg/events"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/user"
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
}

type sqlStore struct {
	db      db.DB
	dialect migrator.Dialect
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

func (ss *sqlStore) DeleteOrg(ctx context.Context, cmd *models.DeleteOrgCommand) error {
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

func (ss *sqlStore) AddOrgUser(ctx context.Context, cmd *org.AddOrgUserCommand) error
func (ss *sqlStore) UpdateOrgUser(ctx context.Context, cmd *org.UpdateOrgUserCommand) error
func (ss *sqlStore) GetOrgUsers(ctx context.Context, query *org.GetOrgUsersQuery) error
func (ss *sqlStore) SearchOrgUsers(ctx context.Context, query *org.SearchOrgUsersQuery) error
func (ss *sqlStore) RemoveOrgUser(ctx context.Context, cmd *org.RemoveOrgUserCommand) error
func (ss *sqlStore) GetUserOrgList(ctx context.Context, query *org.GetUserOrgListQuery) error
func (ss *sqlStore) SetUsingOrg(ctx context.Context, cmd *org.SetUsingOrgCommand) error
