package object

import (
	"fmt"

	"github.com/grafana/grafana/pkg/services/sqlstore/db"
)

// Write the contents of dashboareds table into the object table
func SyncDashboardsToStorage(sql db.DB) {
	fmt.Printf("TODO... query all dashboards... then write to object: %v", sql)
}
