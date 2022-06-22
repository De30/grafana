package accesscontrol

import (
	"strconv"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"xorm.io/xorm"
)

func AddRoleBindingMigrations(mg *migrator.Migrator) {
	roleBindingV1 := migrator.Table{
		Name: "role_binding",
		Columns: []*migrator.Column{
			{Name: "id", Type: migrator.DB_BigInt, IsPrimaryKey: true, IsAutoIncrement: true},
			{Name: "org_id", Type: migrator.DB_BigInt, Default: "0"},
			{Name: "subject_kind", Type: migrator.DB_NVarchar, Length: 190, Nullable: false},
			{Name: "subject_identifier", Type: migrator.DB_NVarchar, Length: 190, Nullable: false},
			{Name: "role_id", Type: migrator.DB_BigInt},
			{Name: "created", Type: migrator.DB_DateTime, Nullable: false},
			{Name: "updated", Type: migrator.DB_DateTime, Nullable: false},
		},
		Indices: []*migrator.Index{
			{Cols: []string{"org_id"}},
			{Cols: []string{"role_id"}},
			{Cols: []string{"subject_kind", "subject_identifier"}},
			{Cols: []string{"org_id", "role_id", "subject_kind", "subject_identifier"}, Type: migrator.UniqueIndex},
		},
	}

	mg.AddMigration("add role binding table", migrator.NewAddTableMigration(roleBindingV1))
	mg.AddMigration("add index role_binding.org_id", migrator.NewAddIndexMigration(roleBindingV1, roleBindingV1.Indices[0]))
	mg.AddMigration("add index role_binding.role_id", migrator.NewAddIndexMigration(roleBindingV1, roleBindingV1.Indices[1]))
	mg.AddMigration("add index role_binding.subject", migrator.NewAddIndexMigration(roleBindingV1, roleBindingV1.Indices[2]))
	mg.AddMigration("add index role_binding.all", migrator.NewAddIndexMigration(roleBindingV1, roleBindingV1.Indices[3]))

	mg.AddMigration("migrate to role binding", &roleBindingMigration{})

}

type roleBindingMigration struct {
	migrator.MigrationBase
}

func (m *roleBindingMigration) SQL(dialect migrator.Dialect) string {
	return CodeMigrationSQL
}

func (m *roleBindingMigration) Exec(sess *xorm.Session, mg *migrator.Migrator) error {
	var userRoles []accesscontrol.UserRole
	if err := sess.SQL("SELECT * FROM user_role").Find(&userRoles); err != nil {
		return err
	}

	var teamRoles []accesscontrol.TeamRole
	if err := sess.SQL("SELECT * FROM team_role").Find(&teamRoles); err != nil {
		return err
	}

	var builtinRoles []accesscontrol.BuiltinRole
	if err := sess.SQL("SELECT * FROM builtin_role").Find(&builtinRoles); err != nil {
		return err
	}

	var bindings []accesscontrol.RoleBinding
	for _, u := range userRoles {
		bindings = append(bindings, accesscontrol.RoleBinding{
			OrgID:             u.OrgID,
			RoleID:            u.RoleID,
			SubjectKind:       "user",
			SubjectIdentifier: strconv.FormatInt(u.UserID, 10),
			Created:           u.Created,
			Updated:           u.Created,
		})
	}

	for _, t := range teamRoles {
		bindings = append(bindings, accesscontrol.RoleBinding{
			OrgID:             t.OrgID,
			RoleID:            t.RoleID,
			SubjectKind:       "team",
			SubjectIdentifier: strconv.FormatInt(t.TeamID, 10),
			Created:           t.Created,
			Updated:           t.Created,
		})
	}

	for _, b := range builtinRoles {
		bindings = append(bindings, accesscontrol.RoleBinding{
			OrgID:             b.OrgID,
			RoleID:            b.RoleID,
			SubjectKind:       "builtin",
			SubjectIdentifier: b.Role,
			Created:           b.Created,
			Updated:           b.Updated,
		})
	}

	return batch(len(bindings), batchSize, func(start, end int) error {
		if _, err := sess.InsertMulti(bindings[start:end]); err != nil {
			return err
		}
		return nil
	})
}
