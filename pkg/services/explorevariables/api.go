package explorevariables

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/tsdb/legacydata"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

func (s *ExploreVariableService) registerAPIEndpoints() {
	s.RouteRegister.Group("/api/explore-variable", func(entities routing.RouteRegister) {
		entities.Post("/", middleware.ReqSignedIn, routing.Wrap(s.createHandler))
		entities.Get("/", middleware.ReqSignedIn, routing.Wrap(s.searchHandler))
		entities.Delete("/:uid", middleware.ReqSignedIn, routing.Wrap(s.deleteHandler))
		entities.Patch("/:uid", middleware.ReqSignedIn, routing.Wrap(s.patchVariableHandler))
	})
}

// swagger:route POST /explore-variable explore_variable createExploreVariable
//
// Add explore variable to explore variables
//
// Adds new variable to explore variables.
//
// Responses:
// 200: getExploreVariableResponse
// 400: badRequestError
// 401: unauthorisedError
// 500: internalServerError
func (s *ExploreVariableService) createHandler(c *models.ReqContext) response.Response {
	cmd := CreateVariableInExploreVariableCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	variable, err := s.CreateVariableInExploreVariable(c.Req.Context(), c.SignedInUser, cmd)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to create explore variable", err)
	}

	return response.JSON(http.StatusOK, ExploreVariableResponse{Result: variable})
}

// swagger:route GET /explore-variable explore_variablesearchVariables
//
// Explore Variable search.
//
// Returns a list of variables that match he search criteria.
// Explore variable search supports pagination. Use the `limit` parameter to control the maximum number of queries returned; the default limit is 100.
// You can also use the `page` query parameter to fetch queries from any page other than the first one.
//
// Responses:
// 200: getExploreVariableSearchResponse
// 401: unauthorisedError
// 500: internalServerError
func (s *ExploreVariableService) searchHandler(c *models.ReqContext) response.Response {
	timeRange := legacydata.NewDataTimeRange(c.Query("from"), c.Query("to"))

	variable := SearchInExploreVariableQuery{
		SearchString: c.Query("searchString"),
		Uids:         c.QueryStrings("uid"),
		Sort:         c.Query("sort"),
		Page:         c.QueryInt("page"),
		Limit:        c.QueryInt("limit"),
		From:         timeRange.GetFromAsSecondsEpoch(),
		To:           timeRange.GetToAsSecondsEpoch(),
	}

	result, err := s.SearchInExploreVariable(c.Req.Context(), c.SignedInUser, variable)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to get explore variables", err)
	}

	return response.JSON(http.StatusOK, ExploreVariableSearchResponse{Result: result})
}

// swagger:route DELETE /explore-variable/{explore_variable_uid} explore_variable deleteVariable
//
// Delete variable in explore variable.
//
// Deletes an existing variable in explore variable as specified by the UID. This operation cannot be reverted.
//
// Responses:
// 200: getExploreVariableDeleteVariableResponse
// 401: unauthorisedError
// 500: internalServerError
func (s *ExploreVariableService) deleteHandler(c *models.ReqContext) response.Response {
	variableUID := web.Params(c.Req)[":uid"]
	if len(variableUID) > 0 && !util.IsValidShortUID(variableUID) {
		return response.Error(http.StatusNotFound, "Variable in explore variable not found", nil)
	}

	id, err := s.DeleteVariableInExploreVariable(c.Req.Context(), c.SignedInUser, variableUID)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to delete variable from explore variable", err)
	}

	return response.JSON(http.StatusOK, ExploreVariableDeleteVariableResponse{
		Message: "Variable deleted",
		ID:      id,
	})
}

// swagger:route PATCH /explore-variable/{explore_variable_uid} explore_variable patchVariable
//
// Update variable in explore variable.
//
// Updates variable in explore variable as specified by the UID.
//
// Responses:
// 200: getExploreVariableResponse
// 400: badRequestError
// 401: unauthorisedError
// 500: internalServerError
func (s *ExploreVariableService) patchVariableHandler(c *models.ReqContext) response.Response {
	variableUID := web.Params(c.Req)[":uid"]
	if len(variableUID) > 0 && !util.IsValidShortUID(variableUID) {
		return response.Error(http.StatusNotFound, "Variable in explore variable not found", nil)
	}

	cmd := PatchVariableInExploreVariableCommand{}
	if err := web.Bind(c.Req, &cmd); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	variable, err := s.PatchVariableInExploreVariable(c.Req.Context(), c.SignedInUser, variableUID, cmd)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Failed to update variable in explore variable", err)
	}

	return response.JSON(http.StatusOK, ExploreVariableResponse{Result: variable})
}

// swagger:parameters patchVariable deleteVariable
type ExploreVariableByUID struct {
	// in:path
	// required:true
	UID string `json:"explore_variable_uid"`
}

// swagger:parameters searchVariables
type SearchVariablesParams struct {
	// Text inside variable that is searched for
	// in:query
	// required: false
	SearchString string `json:"searchString"`
	// Sort method
	// in:query
	// required: false
	// default: time-desc
	// Enum: time-desc,time-asc
	Sort string `json:"sort"`
	// Use this parameter to access hits beyond limit. Numbering starts at 1. limit param acts as page size.
	// in:query
	// required: false
	Page int `json:"page"`
	// Limit the number of returned results
	// in:query
	// required: false
	Limit int `json:"limit"`
	// From range for the explore variable search
	// in:query
	// required: false
	From int64 `json:"from"`
	// To range for the explore variable search
	// in:query
	// required: false
	To int64 `json:"to"`
}

// swagger:parameters createVariable
type CreateExploreVariableParams struct {
	// in:body
	// required:true
	Body CreateVariableInExploreVariableCommand `json:"body"`
}

// swagger:parameters patchVariable
type PatchExploreVariableParams struct {
	// in:body
	// required:true
	Body PatchVariableInExploreVariableCommand `json:"body"`
}

//swagger:response getExploreVariableSearchResponse
type GetExploreVariableSearchResponse struct {
	// in: body
	Body ExploreVariableSearchResponse `json:"body"`
}

// swagger:response getExploreVariableResponse
type GetExploreVariableResponse struct {
	// in: body
	Body ExploreVariableResponse `json:"body"`
}

// swagger:response getExploreVariableDeleteVariableResponse
type GetExploreVariableDeleteVariableResponse struct {
	// in: body
	Body ExploreVariableDeleteVariableResponse `json:"body"`
}
