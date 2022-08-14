package explorevariables

import (
	"context"
	"time"

	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/util"
)

// createVariable adds a variable into explore variable
func (s ExploreVariableService) createVariable(ctx context.Context, user *user.SignedInUser, cmd CreateVariableInExploreVariableCommand) (ExploreVariableDTO, error) {
	exploreVariables := ExploreVariable{
		OrgID:     user.OrgID,
		UID:       util.GenerateShortUID(),
		Values:    cmd.Values,
		CreatedBy: user.UserID,
		CreatedAt: time.Now().Unix(),
		Name:      cmd.Name,
		Label:     cmd.Label,
		Desc:      cmd.Desc,
	}

	err := s.SQLStore.WithDbSession(ctx, func(session *sqlstore.DBSession) error {
		_, err := session.Insert(&exploreVariables)
		return err
	})
	if err != nil {
		return ExploreVariableDTO{}, err
	}

	dto := ExploreVariableDTO{
		UID:       exploreVariables.UID,
		CreatedBy: exploreVariables.CreatedBy,
		CreatedAt: exploreVariables.CreatedAt,
		Name:      exploreVariables.Name,
		Label:     exploreVariables.Label,
		Desc:      exploreVariables.Desc,
		Values:    exploreVariables.Values,
	}

	return dto, nil
}

// searchQueries searches for queries in explore variable based on provided parameters
func (s ExploreVariableService) searchVariables(ctx context.Context, user *user.SignedInUser, query SearchInExploreVariableQuery) (ExploreVariableSearchResult, error) {
	var dtos []ExploreVariableDTO
	var allQueries ExploreVariableSearchCount

	if query.To <= 0 {
		query.To = time.Now().Unix()
	}

	if query.Page <= 0 {
		query.Page = 1
	}

	if query.Limit <= 0 {
		query.Limit = 100
	}

	if query.Sort == "" {
		query.Sort = "time-desc"
	}

	err := s.SQLStore.WithDbSession(ctx, func(session *sqlstore.DBSession) error {
		dtosBuilder := sqlstore.SQLBuilder{}
		dtosBuilder.Write(`SELECT
			explore_variable.uid,
			explore_variable.created_by,
			explore_variable.created_at AS created_at,
			explore_variable.label,
			explore_variable.name,
			explore_variable.desc,
			explore_variable.'values'
			FROM explore_variable
		`)
		writeFiltersSQL(query, user, s.SQLStore, &dtosBuilder)
		//writeSortSQL(query, s.SQLStore, &dtosBuilder)
		//writeLimitSQL(query, s.SQLStore, &dtosBuilder)
		//writeOffsetSQL(query, s.SQLStore, &dtosBuilder)
		err := session.SQL(dtosBuilder.GetSQLString(), dtosBuilder.GetParams()...).Find(&dtos)
		if err != nil {
			return err
		}

		rawSQL := `SELECT (SELECT COUNT(*) FROM explore_variable) as all_record_count`
		_, err = session.SQL(rawSQL).Get(&allQueries)
		return err
	})

	if err != nil {
		return ExploreVariableSearchResult{}, err
	}

	response := ExploreVariableSearchResult{
		ExploreVariable: dtos,
		TotalCount:      allQueries.AllRecordCount,
		Page:            query.Page,
		PerPage:         query.Limit,
	}

	return response, nil
}

func (s ExploreVariableService) deleteVariable(ctx context.Context, user *user.SignedInUser, UID string) (int64, error) {
	var queryID int64
	err := s.SQLStore.WithTransactionalDbSession(ctx, func(session *sqlstore.DBSession) error {
		id, err := session.Where("org_id = ? AND created_by = ? AND uid = ?", user.OrgID, user.UserID, UID).Delete(ExploreVariable{})
		if err != nil {
			return err
		}
		if id == 0 {
			return ErrVariableNotFound
		}

		queryID = id
		return nil
	})

	return queryID, err
}

// patchQueryComment searches updates comment for query in explore variable
func (s ExploreVariableService) patchVariable(ctx context.Context, user *user.SignedInUser, UID string, cmd PatchVariableInExploreVariableCommand) (ExploreVariableDTO, error) {
	var exploreVariable ExploreVariable

	err := s.SQLStore.WithTransactionalDbSession(ctx, func(session *sqlstore.DBSession) error {
		exists, err := session.Where("org_id = ? AND created_by = ? AND uid = ?", user.OrgID, user.UserID, UID).Get(&exploreVariable)
		if err != nil {
			return err
		}
		if !exists {
			return ErrVariableNotFound
		}

		exploreVariable.Values = cmd.Values
		exploreVariable.Name = cmd.Name
		exploreVariable.Label = cmd.Label
		exploreVariable.Desc = cmd.Desc

		_, err = session.ID(exploreVariable.ID).Update(exploreVariable)
		if err != nil {
			return err
		}
		return nil
	})

	if err != nil {
		return ExploreVariableDTO{}, err
	}

	dto := ExploreVariableDTO{
		UID:       exploreVariable.UID,
		CreatedBy: exploreVariable.CreatedBy,
		CreatedAt: exploreVariable.CreatedAt,
		Name:      exploreVariable.Name,
		Label:     exploreVariable.Label,
		Desc:      exploreVariable.Desc,
		Values:    exploreVariable.Values,
	}

	return dto, nil
}
