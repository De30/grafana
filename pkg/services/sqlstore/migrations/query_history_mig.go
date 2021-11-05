package migrations

import (
	. "github.com/grafana/grafana/pkg/services/sqlstore/migrator"
)

func addQueryHistoryMigrations(mg *Migrator) {
	queryHistoryV1 := Table{
		Name: "query_history",
		Columns: []*Column{
			{Name: "id", Type: DB_BigInt, Nullable: false, IsPrimaryKey: true, IsAutoIncrement: true},
			{Name: "org_id", Type: DB_BigInt, Nullable: false},
			{Name: "datasource_uid", Type: DB_BigInt, Nullable: false},
			{Name: "uid", Type: DB_NVarchar, Length: 40, Nullable: false},
			{Name: "created_by", Type: DB_Int, Nullable: false},
			{Name: "created_at", Type: DB_Int, Nullable: false},
			{Name: "last_seen_at", Type: DB_Int, Nullable: true},
			{Name: "path", Type: DB_Text, Nullable: false},
		},
		Indices: []*Index{
			{Cols: []string{"org_id", "uid"}, Type: UniqueIndex},
		},
	}

	mg.AddMigration("create query_history table v1", NewAddTableMigration(queryHistoryV1))

	mg.AddMigration("add index query_history.org_id-uid", NewAddIndexMigration(queryHistoryV1, queryHistoryV1.Indices[0]))
}
