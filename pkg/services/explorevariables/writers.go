package explorevariables

import (
	"bytes"
	"strings"

	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/user"
)

func writeFiltersSQL(query SearchInExploreVariableQuery, user *user.SignedInUser, sqlStore *sqlstore.SQLStore, builder *sqlstore.SQLBuilder) {
	params := []interface{}{user.OrgID, query.From, query.To, "%" + query.SearchString + "%", "%" + query.SearchString + "%", "%" + query.SearchString + "%"}
	var sql bytes.Buffer

	queryString := "WHERE explore_variable.org_id = ? " +
		" AND explore_variable.created_at >= ? " +
		" AND explore_variable.created_at <= ? " +
		" AND (explore_variable.name " + sqlStore.Dialect.LikeStr() + " ? OR explore_variable.label " + sqlStore.Dialect.LikeStr() + " ? OR explore_variable.desc " + sqlStore.Dialect.LikeStr() + " ?) "

	if len(query.Uids) > 0 {
		queryString += ` AND explore_variable.uid IN (?` + strings.Repeat(",?", len(query.Uids)-1) + `) `
		for _, uid := range query.Uids {
			params = append(params, uid)
		}
	}

	sql.WriteString(queryString)
	builder.Write(sql.String(), params...)
}

/* func writeSortSQL(query SearchInExploreVariableQuery, sqlStore *sqlstore.SQLStore, builder *sqlstore.SQLBuilder) {
	if query.Sort == "time-asc" {
		builder.Write(" ORDER BY created_at ASC ")
	} else {
		builder.Write(" ORDER BY created_at DESC ")
	}
}

func writeLimitSQL(query SearchInExploreVariableQuery, sqlStore *sqlstore.SQLStore, builder *sqlstore.SQLBuilder) {
	builder.Write(" LIMIT ? ", query.Limit)
}

func writeOffsetSQL(query SearchInExploreVariableQuery, sqlStore *sqlstore.SQLStore, builder *sqlstore.SQLBuilder) {
	builder.Write(" OFFSET ? ", query.Limit*(query.Page-1))
}*/
