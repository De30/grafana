//go:build integration
// +build integration

package migrations

import (
	"fmt"
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"xorm.io/xorm"

	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrations"
	"github.com/grafana/grafana/pkg/services/sqlstore/migrator"
	"github.com/grafana/grafana/pkg/services/sqlstore/sqlutil"
	"github.com/grafana/grafana/pkg/setting"
)

func TestImmutableMigrations(t *testing.T) {

	// TODO we need to wipe the DB before this test, if it doesn't do so already.
	ossMigrations := migrations.ProvideOSSMigrations()
	ss := sqlstore.InitTestDBWithMigration(t, ossMigrations)

	assert.NotNil(t, ss)

	dbType := migrator.SQLite

	// environment variable present for test db?
	if db, present := os.LookupEnv("GRAFANA_TEST_DB"); present {
		dbType = db
	}

	var featuresEnabledDuringTests = []string{
		featuremgmt.FlagDashboardPreviews,
		featuremgmt.FlagDashboardComments,
	}
	features := make([]string, len(featuresEnabledDuringTests))
	copy(features, featuresEnabledDuringTests)

	// set test db config
	cfg := setting.NewCfg()
	cfg.IsFeatureToggleEnabled = func(key string) bool {
		for _, enabledFeature := range features {
			if enabledFeature == key {
				return true
			}
		}
		return false
	}
	sec, err := cfg.Raw.NewSection("database")
	if err != nil {
		return
	}
	if _, err := sec.NewKey("type", dbType); err != nil {
		return
	}
	switch dbType {
	case "mysql":
		if _, err := sec.NewKey("connection_string", sqlutil.MySQLTestDB().ConnStr); err != nil {
			return
		}
	case "postgres":
		if _, err := sec.NewKey("connection_string", sqlutil.PostgresTestDB().ConnStr); err != nil {
			return
		}
	default:
		if _, err := sec.NewKey("connection_string", sqlutil.SQLite3TestDB().ConnStr); err != nil {
			return
		}
	}

	// need to get engine to clean db before we init
	engine, err := xorm.NewEngine(dbType, sec.Key("connection_string").String())
	if err != nil {
		return
	}

	engine.DatabaseTZ = time.UTC
	engine.TZLocation = time.UTC

	fmt.Printf("%v", ss)

	mg := migrator.NewMigrator(engine, ss.Cfg)

	migrationLog, err := mg.GetMigrationLog()
	assert.NotNil(t, migrationLog)

	// t.Logf("%v", migrationLog) // must run with -test.v to see this

	for k, v := range migrationLog {
		t.Logf("%s : %s", k, v.MigrationID)
	}

	// migrationLog is a map with key = migration ID and val of MigrationLog
	// there is no guarantee of order on this. So we have to order by ID within the MigrationLog

	// OR we can exec a custom query against mg.DBEngine ?

	orderedLogs := make([]migrator.MigrationLog{}, 0, len(migrationLog)
	for k := range migrationLog {
		orderedLogs = append(orderedLogs, migrationLog[k])
	}

	sort.Slice(orderedLogs, func(i, j int) bool {
		return orderedLogs[i].Id > orderedLogs[j].Id
	})

	// should now be ordered

	// we should compare:
	// ID, migration ID and SQL
	// seeing as SQL could be multitline, we could store the golden file as 





}
