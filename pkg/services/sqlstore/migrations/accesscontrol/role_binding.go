package accesscontrol

import "github.com/grafana/grafana/pkg/services/sqlstore/migrator"

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

}
