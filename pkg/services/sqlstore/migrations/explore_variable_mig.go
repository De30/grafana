package migrations

import (
	. "github.com/grafana/grafana/pkg/services/sqlstore/migrator"
)

func addExploreVariableMigrations(mg *Migrator) {
	exploreVariablesV1 := Table{
		Name: "explore_variable",
		Columns: []*Column{
			{Name: "id", Type: DB_BigInt, Nullable: false, IsPrimaryKey: true, IsAutoIncrement: true},
			{Name: "uid", Type: DB_NVarchar, Length: 40, Nullable: false},
			{Name: "org_id", Type: DB_BigInt, Nullable: false},
			{Name: "created_by", Type: DB_Int, Nullable: false},
			{Name: "created_at", Type: DB_Int, Nullable: false},
			{Name: "label", Type: DB_Text, Nullable: true},
			{Name: "name", Type: DB_Text, Nullable: false},
			{Name: "desc", Type: DB_Text, Nullable: true},
			{Name: "values", Type: DB_Text, Nullable: false},
		},
		Indices: []*Index{
			{Cols: []string{"org_id", "created_by", "name"}},
		},
	}

	mg.AddMigration("create explore_variable table v1", NewAddTableMigration(exploreVariablesV1))

	mg.AddMigration("add index explore_variable.org_id-created_by-name", NewAddIndexMigration(exploreVariablesV1, exploreVariablesV1.Indices[0]))
}
