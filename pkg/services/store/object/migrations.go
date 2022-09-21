package object

import (
	"fmt"

	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
)

func AddObjectStorageMigrations(mg *migrator.Migrator) {
	objectTable := migrator.Table{
		Name: "object",
		Columns: []*migrator.Column{
			// includes orgID!
			{Name: "path", Type: migrator.DB_NVarchar, Length: 1024, Nullable: false},

			// path_hash is used for indexing. we are using it to circumvent the max length limit of 191 for varchar2 fields in MySQL 5.6
			{Name: "path_hash", Type: migrator.DB_NVarchar, Length: 64, Nullable: false, IsPrimaryKey: true},

			// parent_folder_path_hash is an optimization for a common use case - list all files in a given folder
			{Name: "parent_folder_path_hash", Type: migrator.DB_NVarchar, Length: 64, Nullable: false},

			// contentType? kind?
			{Name: "content_type", Type: migrator.DB_NVarchar, Length: 255, Nullable: false},

			// The raw object body (any byte array)
			{Name: "size", Type: migrator.DB_BigInt, Nullable: false},
			{Name: "body", Type: migrator.DB_Blob, Nullable: false},
			{Name: "etag", Type: migrator.DB_NVarchar, Length: 32, Nullable: false}, // md5(body)
			{Name: "meta", Type: migrator.DB_Blob, Nullable: true},

			// Who changed what when
			{Name: "updated", Type: migrator.DB_DateTime, Nullable: false},
			{Name: "created", Type: migrator.DB_DateTime, Nullable: false},
			{Name: "updated_by", Type: migrator.DB_Int, Nullable: false}, // joined to user table
			{Name: "created_by", Type: migrator.DB_Int, Nullable: false}, // joined to user table

			// The changelog entry when this was saved
			{Name: "message", Type: migrator.DB_Text, Nullable: true},
			{Name: "version", Type: migrator.DB_NVarchar, Length: 128, Nullable: true},
			{Name: "sync", Type: migrator.DB_DateTime, Nullable: true},

			// Summary data (extracted from the avove values.... could be joined)
			{Name: "name", Type: migrator.DB_NVarchar, Length: 255, Nullable: false},
			{Name: "description", Type: migrator.DB_NVarchar, Length: 255, Nullable: true},
			{Name: "labels", Type: migrator.DB_Text, Nullable: true},  // duplicated, but searchable in `object_labels` table
			{Name: "summary", Type: migrator.DB_Text, Nullable: true}, // JSON returned in a list operation
			{Name: "nested", Type: migrator.DB_Text, Nullable: true},  // Optional JSON for nested objects
		},
		PrimaryKeys: []string{"path_hash"},
		Indices: []*migrator.Index{
			//	{Cols: []string{"path_hash"}, Type: migrator.UniqueIndex},
			{Cols: []string{"parent_folder_path_hash"}}, // list in folder
			{Cols: []string{"content_type"}},            // filter by type
		},
	}

	objectLabelsTable := migrator.Table{
		Name: "object_labels",
		Columns: []*migrator.Column{
			{Name: "path_hash", Type: migrator.DB_NVarchar, Length: 64, Nullable: false},

			// 191 is the maximum length of indexable VARCHAR fields in MySQL 5.6 <= with utf8mb4 encoding
			{Name: "key", Type: migrator.DB_NVarchar, Length: 191, Nullable: false},
			{Name: "value", Type: migrator.DB_NVarchar, Length: 1024, Nullable: false},
		},
		Indices: []*migrator.Index{
			{Cols: []string{"path_hash", "key"}, Type: migrator.UniqueIndex},
		},
	}

	objectReferenceTable := migrator.Table{
		Name: "object_ref",
		Columns: []*migrator.Column{
			// FROM:
			{Name: "path_hash", Type: migrator.DB_NVarchar, Length: 64, Nullable: false},

			// TO:
			{Name: "kind", Type: migrator.DB_NVarchar, Length: 255, Nullable: false},
			{Name: "type", Type: migrator.DB_NVarchar, Length: 255, Nullable: true},
			{Name: "uid", Type: migrator.DB_NVarchar, Length: 1024, Nullable: true}, // path?
			// 191 is the maximum length of indexable VARCHAR fields in MySQL 5.6 <= with utf8mb4 encoding
		},
		Indices: []*migrator.Index{
			{Cols: []string{"path_hash"}, Type: migrator.UniqueIndex},
		},
	}

	objectHistoryTable := migrator.Table{
		Name: "object_history",
		Columns: []*migrator.Column{
			{Name: "path_hash", Type: migrator.DB_NVarchar, Length: 64, Nullable: false}, // JOIN to object
			{Name: "version", Type: migrator.DB_NVarchar, Length: 128, Nullable: true},
			{Name: "updated", Type: migrator.DB_DateTime, Nullable: false},
			{Name: "updated_by", Type: migrator.DB_Int, Nullable: false},
			{Name: "message", Type: migrator.DB_Text, Nullable: false},
			{Name: "body", Type: migrator.DB_Blob, Nullable: false},
			{Name: "size", Type: migrator.DB_BigInt, Nullable: false},
		},
		Indices: []*migrator.Index{
			{Cols: []string{"path_hash"}, Type: migrator.UniqueIndex},
		},
	}

	tables := []migrator.Table{objectTable, objectLabelsTable, objectReferenceTable, objectHistoryTable}
	for t := range tables {
		mg.AddMigration("create table "+tables[t].Name, migrator.NewAddTableMigration(tables[t]))
		for i := range tables[t].Indices {
			mg.AddMigration(fmt.Sprintf("create index %s[%d]", tables[t].Name, i), migrator.NewAddIndexMigration(tables[t], tables[t].Indices[i]))
		}
	}

	// TODO: add collation support to `migrator.Column`
	mg.AddMigration("set path collation in object tables", migrator.NewRawSQLMigration("").
		// MySQL `utf8mb4_unicode_ci` collation is set in `mysql_dialect.go`
		// SQLite uses a `BINARY` collation by default
		Postgres("ALTER TABLE object ALTER COLUMN path TYPE VARCHAR(1024) COLLATE \"C\";")) // Collate C - sorting done based on character code byte values
}
