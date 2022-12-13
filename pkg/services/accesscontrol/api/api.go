package api

import (
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
)

func NewAccessControlAPI(router routing.RouteRegister, accesscontrol ac.AccessControl, service ac.Service,
	features *featuremgmt.FeatureManager) *AccessControlAPI {
	return &AccessControlAPI{
		RouteRegister: router,
		Service:       service,
		AccessControl: accesscontrol,
		features:      features,
	}
}

type AccessControlAPI struct {
	Service       ac.Service
	AccessControl ac.AccessControl
	RouteRegister routing.RouteRegister
	features      *featuremgmt.FeatureManager
}

func (api *AccessControlAPI) RegisterAPIEndpoints() {
	authorize := ac.Middleware(api.AccessControl)
	// Users
	api.RouteRegister.Group("/api/access-control", func(rr routing.RouteRegister) {
		rr.Get("/user/actions", middleware.ReqSignedIn, routing.Wrap(api.getUserActions))
		rr.Get("/user/permissions", middleware.ReqSignedIn, routing.Wrap(api.getUserPermissions))
		if api.features.IsEnabled(featuremgmt.FlagAccessControlOnCall) {
			rr.Get("/users/permissions/search", authorize(middleware.ReqSignedIn,
				ac.EvalPermission(ac.ActionUsersPermissionsRead)), routing.Wrap(api.SearchUsersPermissions))
		}
	})
}

// GET /api/access-control/user/actions
func (api *AccessControlAPI) getUserActions(c *models.ReqContext) response.Response {
	reloadCache := c.QueryBool("reloadcache")
	permissions, err := api.Service.GetUserPermissions(c.Req.Context(),
		c.SignedInUser, ac.Options{ReloadCache: reloadCache})
	if err != nil {
		response.JSON(http.StatusInternalServerError, err)
	}

	return response.JSON(http.StatusOK, ac.BuildPermissionsMap(permissions))
}

// GET /api/access-control/user/permissions
func (api *AccessControlAPI) getUserPermissions(c *models.ReqContext) response.Response {
	reloadCache := c.QueryBool("reloadcache")
	permissions, err := api.Service.GetUserPermissions(c.Req.Context(),
		c.SignedInUser, ac.Options{ReloadCache: reloadCache})
	if err != nil {
		response.JSON(http.StatusInternalServerError, err)
	}

	return response.JSON(http.StatusOK, ac.GroupScopesByAction(permissions))
}

// GET /api/access-control/users/permissions
func (api *AccessControlAPI) SearchUsersPermissions(c *models.ReqContext) response.Response {
	searchOptions := ac.SearchOptions{
		ActionPrefix: c.Query("actionPrefix"),
		Action:       c.Query("action"),
		Scope:        c.Query("scope"),
	}

	// Validate inputs
	if (searchOptions.ActionPrefix != "") == (searchOptions.Action != "") {
		return response.JSON(http.StatusBadRequest, "provide one of 'action' or 'actionPrefix'")
	}

	// Compute metadata
	permissions, err := api.Service.SearchUsersPermissions(c.Req.Context(), c.SignedInUser, c.OrgID, searchOptions)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "could not get org user permissions", err)
	}

	permsByAction := map[int64]map[string][]string{}
	for userID, userPerms := range permissions {
		permsByAction[userID] = ac.GroupScopesByAction(userPerms)
	}

	return response.JSON(http.StatusOK, permsByAction)
}
