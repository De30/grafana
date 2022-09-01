package userimpl

import (
	"context"
	"fmt"
	"time"

	"github.com/grafana/grafana/pkg/events"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/user"
)

type store interface {
	Insert(context.Context, *user.User) (int64, error)
	Get(context.Context, *user.User) (*user.User, error)
	GetByID(context.Context, int64) (*user.User, error)
	GetNotServiceAccount(context.Context, int64) (*user.User, error)
	Delete(context.Context, int64) error
	CaseInsensitiveLoginConflict(context.Context, string, string) error
	UserMetrics(context.Context) (map[string]int64, error)
	CountUserRoles(context.Context) (map[user.StatsKind]user.RoleStats, error)
}

type sqlStore struct {
	db      db.DB
	dialect migrator.Dialect
}

func (ss *sqlStore) Insert(ctx context.Context, cmd *user.User) (int64, error) {
	var userID int64
	var err error
	err = ss.db.WithTransactionalDbSession(ctx, func(sess *sqlstore.DBSession) error {
		sess.UseBool("is_admin")

		if userID, err = sess.Insert(cmd); err != nil {
			return err
		}
		sess.PublishAfterCommit(&events.UserCreated{
			Timestamp: cmd.Created,
			Id:        cmd.ID,
			Name:      cmd.Name,
			Login:     cmd.Login,
			Email:     cmd.Email,
		})
		return nil
	})
	if err != nil {
		return 0, err
	}
	return userID, nil
}

func (ss *sqlStore) Get(ctx context.Context, usr *user.User) (*user.User, error) {
	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		exists, err := sess.Where("email=? OR login=?", usr.Email, usr.Login).Get(usr)
		if !exists {
			return user.ErrUserNotFound
		}
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return usr, nil
}

func (ss *sqlStore) Delete(ctx context.Context, userID int64) error {
	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		var rawSQL = "DELETE FROM " + ss.dialect.Quote("user") + " WHERE id = ?"
		_, err := sess.Exec(rawSQL, userID)
		return err
	})
	if err != nil {
		return err
	}
	return nil
}

func (ss *sqlStore) GetNotServiceAccount(ctx context.Context, userID int64) (*user.User, error) {
	usr := user.User{ID: userID}
	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		has, err := sess.Where(ss.notServiceAccountFilter()).Get(&usr)
		if err != nil {
			return err
		}
		if !has {
			return user.ErrUserNotFound
		}
		return nil
	})
	return &usr, err
}

func (ss *sqlStore) GetByID(ctx context.Context, userID int64) (*user.User, error) {
	var usr user.User

	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		has, err := sess.ID(&userID).
			Where(ss.notServiceAccountFilter()).
			Get(&usr)

		if err != nil {
			return err
		} else if !has {
			return user.ErrUserNotFound
		}
		return nil
	})
	return &usr, err
}

func (ss *sqlStore) notServiceAccountFilter() string {
	return fmt.Sprintf("%s.is_service_account = %s",
		ss.dialect.Quote("user"),
		ss.dialect.BooleanStr(false))
}

func (ss *sqlStore) CaseInsensitiveLoginConflict(ctx context.Context, login, email string) error {
	users := make([]user.User, 0)
	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		if err := sess.Where("LOWER(email)=LOWER(?) OR LOWER(login)=LOWER(?)",
			email, login).Find(&users); err != nil {
			return err
		}

		if len(users) > 1 {
			return &user.ErrCaseInsensitiveLoginConflict{Users: users}
		}
		return nil
	})
	return err
}

const (
	activeUserTimeLimit      = time.Hour * 24 * 30
	dailyActiveUserTimeLimit = time.Hour * 24
)

func (ss *sqlStore) UserMetrics(ctx context.Context) (map[string]int64, error) {
	userTable := ss.dialect.Quote("user")
	now := time.Now()
	stats := map[string]int64{}
	sb := &sqlstore.SQLBuilder{}

	sb.Write("SELECT ")
	sb.Write(`(SELECT COUNT(*) FROM ` + userTable + ` WHERE ` + ss.notServiceAccountFilter() + `) AS users,`)

	activeUserDeadlineDate := now.Add(-activeUserTimeLimit)
	sb.Write(`(SELECT COUNT(*) FROM `+userTable+` WHERE `+
		ss.notServiceAccountFilter()+` AND last_seen_at > ?) AS active_users,`, activeUserDeadlineDate)

	dailyActiveUserDeadlineDate := now.Add(-dailyActiveUserTimeLimit)
	sb.Write(`(SELECT COUNT(*) FROM `+userTable+` WHERE `+
		ss.notServiceAccountFilter()+` AND last_seen_at > ?) AS daily_active_users,`, dailyActiveUserDeadlineDate)

	monthlyActiveUserDeadlineDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, now.Location())
	sb.Write(`(SELECT COUNT(*) FROM `+userTable+` WHERE `+
		ss.notServiceAccountFilter()+` AND last_seen_at > ?) AS monthly_active_users,`, monthlyActiveUserDeadlineDate)

	err := ss.db.WithDbSession(ctx, func(sess *sqlstore.DBSession) error {
		_, err := sess.SQL(sb.GetSQLString(), sb.GetParams()...).Get(&stats)
		return err
	})

	return stats, err
}

func (ss *sqlStore) CountUserRoles(ctx context.Context) (map[user.StatsKind]user.RoleStats, error) {
	// There is some SQL magic going on in this function to get a limited set of
	// rows back from the database (<=3*7 rows, rather than <=3 times the number
	// of users). It might not be necessary to do it this way, but this works.
	//
	// A user can be present in multiple orgs (have multiple rows in org_users),
	// so in order to figure out whether a user is an admin, editor or viewer we
	// need to get only the highest of their assigned roles.
	//
	// We do so by first converting the roles into numbers
	// (0b100=>admin, 0b010=>editor, 0b001=>viewer), removing any duplicates,
	// and finally adding up a user's numeric roles. This means a user that's
	// both an editor and a viewer will have 3 or 0b011 as their number.
	//
	// We can now use a bitwise AND operation to check, in order, whether
	// this user is an admin (0b100 & 0b011 => 0b000, user is not an admin)
	// or an editor (0b010 & 0b011 => 0b010, user is an editor).

	stats := map[user.StatsKind]user.RoleStats{}
	userTable := ss.dialect.Quote("user")

	err := ss.db.WithDbSession(ctx, func(dbSession *sqlstore.DBSession) error {
		query := `
SELECT role AS bitrole, active, COUNT(role) AS count FROM
  (SELECT last_seen_at>? AS active, last_seen_at>? AS daily_active, SUM(role) AS role
   FROM (SELECT
      u.id,
      CASE org_user.role
        WHEN 'Admin' THEN 4
        WHEN 'Editor' THEN 2
        ELSE 1
      END AS role,
      u.last_seen_at
    FROM ` + userTable + ` AS u INNER JOIN org_user ON org_user.user_id = u.id
    GROUP BY u.id, u.last_seen_at, org_user.role) AS t2
  GROUP BY id, last_seen_at) AS t1
GROUP BY active, daily_active, role;`

		activeUserDeadline := time.Now().Add(-activeUserTimeLimit)
		dailyActiveUserDeadline := time.Now().Add(-dailyActiveUserTimeLimit)

		type rolebitmap struct {
			Active      bool
			DailyActive bool
			Bitrole     int64
			Count       int64
		}

		bitmap := []rolebitmap{}
		err := dbSession.Context(ctx).SQL(query, activeUserDeadline, dailyActiveUserDeadline).Find(&bitmap)
		if err != nil {
			return err
		}

		for _, role := range bitmap {
			roletype := org.RoleViewer
			if role.Bitrole&0b100 != 0 {
				roletype = org.RoleAdmin
			} else if role.Bitrole&0b10 != 0 {
				roletype = org.RoleEditor
			}

			stats[user.StatsKindTotal] = stats[user.StatsKindTotal].Add(role.Count, roletype)
			if role.Active {
				stats[user.StatsKindActive] = stats[user.StatsKindActive].Add(role.Count, roletype)
			}
			if role.DailyActive {
				stats[user.StatsKindDaily] = stats[user.StatsKindDaily].Add(role.Count, roletype)
			}
		}

		return nil
	})

	return stats, err
}
