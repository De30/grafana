package plugins

import "github.com/grafana/grafana/pkg/services/sqlstore/migrator"

func AddMigration(mg *migrator.Migrator) {
	remotePlugins := migrator.Table{
		Name: "remote_plugin",
		Columns: []*migrator.Column{
			{Name: "plugin_id", Type: migrator.DB_NVarchar, Length: 512},
			{Name: "route", Type: migrator.DB_Text},
		},
	}

	mg.AddMigration("create remote plugin table", migrator.NewAddTableMigration(remotePlugins))
}
