// Package api contains API logic.
package api

import (
	"time"

	"github.com/grafana/grafana/pkg/api/avatar"
	"github.com/grafana/grafana/pkg/api/frontendlogging"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/api/routing/wrap"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	acmiddleware "github.com/grafana/grafana/pkg/services/accesscontrol/middleware"
	sa "github.com/grafana/grafana/pkg/services/serviceaccounts/manager"
)

var plog = log.New("api")

// registerRoutes registers all API HTTP routes.
func (hs *HTTPServer) registerRoutes() {
	reqNoAuth := middleware.NoAuth()
	reqSignedIn := middleware.ReqSignedIn
	reqNotSignedIn := middleware.ReqNotSignedIn
	reqSignedInNoAnonymous := middleware.ReqSignedInNoAnonymous
	reqGrafanaAdmin := middleware.ReqGrafanaAdmin
	reqEditorRole := middleware.ReqEditorRole
	reqOrgAdmin := middleware.ReqOrgAdmin
	reqOrgAdminFolderAdminOrTeamAdmin := middleware.OrgAdminFolderAdminOrTeamAdmin
	reqCanAccessTeams := middleware.AdminOrFeatureEnabled(hs.Cfg.EditorsCanAdmin)
	reqSnapshotPublicModeOrSignedIn := middleware.SnapshotPublicModeOrSignedIn(hs.Cfg)
	redirectFromLegacyPanelEditURL := middleware.RedirectFromLegacyPanelEditURL(hs.Cfg)
	authorize := acmiddleware.Middleware(hs.AccessControl)
	authorizeInOrg := acmiddleware.AuthorizeInOrgMiddleware(hs.AccessControl, hs.SQLStore)
	quota := middleware.Quota(hs.QuotaService)

	r := hs.RouteRegister

	// not logged in views
	r.Get("/logout", wrap.Wrap(hs.Logout))
	r.Post("/login", quota("session"), wrap.Wrap(hs.LoginPost))
	r.Get("/login/:name", quota("session"), wrap.Wrap(hs.OAuthLogin))
	r.Get("/login", wrap.WrapNoResponse(hs.LoginView))
	r.Get("/invite/:code", wrap.WrapNoResponse(hs.Index))

	// authed views
	r.Get("/", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/profile/", reqSignedInNoAnonymous, wrap.WrapNoResponse(hs.Index))
	r.Get("/profile/password", reqSignedInNoAnonymous, wrap.WrapNoResponse(hs.Index))
	r.Get("/.well-known/change-password", wrap.WrapNoResponse(redirectToChangePassword))
	r.Get("/profile/switch-org/:id", reqSignedInNoAnonymous, wrap.WrapNoResponse(hs.ChangeActiveOrgAndRedirectToHome))
	r.Get("/org/", authorize(reqOrgAdmin, orgPreferencesAccessEvaluator), wrap.WrapNoResponse(hs.Index))
	r.Get("/org/new", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseGlobalOrg, orgsCreateAccessEvaluator), wrap.WrapNoResponse(hs.Index))
	r.Get("/datasources/", authorize(reqOrgAdmin, dataSourcesConfigurationAccessEvaluator), wrap.WrapNoResponse(hs.Index))
	r.Get("/datasources/new", authorize(reqOrgAdmin, dataSourcesNewAccessEvaluator), wrap.WrapNoResponse(hs.Index))
	r.Get("/datasources/edit/*", authorize(reqOrgAdmin, dataSourcesEditAccessEvaluator), wrap.WrapNoResponse(hs.Index))
	r.Get("/org/users", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionOrgUsersRead, ac.ScopeUsersAll)), wrap.WrapNoResponse(hs.Index))
	r.Get("/org/users/new", reqOrgAdmin, wrap.WrapNoResponse(hs.Index))
	r.Get("/org/users/invite", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionUsersCreate)), wrap.WrapNoResponse(hs.Index))
	r.Get("/org/teams", reqCanAccessTeams, wrap.WrapNoResponse(hs.Index))
	r.Get("/org/teams/*", reqCanAccessTeams, wrap.WrapNoResponse(hs.Index))
	r.Get("/org/apikeys/", reqOrgAdmin, wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboard/import/", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/configuration", reqGrafanaAdmin, wrap.WrapNoResponse(hs.Index))
	r.Get("/admin", reqGrafanaAdmin, wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/settings", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionSettingsRead)), wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/users", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead, ac.ScopeGlobalUsersAll)), wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/users/create", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersCreate)), wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/users/edit/:id", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead)), wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/orgs", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseGlobalOrg, orgsAccessEvaluator), wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/orgs/edit/:id", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseGlobalOrg, orgsAccessEvaluator), wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/stats", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionServerStatsRead)), wrap.WrapNoResponse(hs.Index))
	r.Get("/admin/ldap", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionLDAPStatusRead)), wrap.WrapNoResponse(hs.Index))
	r.Get("/styleguide", reqSignedIn, wrap.WrapNoResponse(hs.Index))

	r.Get("/live", reqGrafanaAdmin, wrap.WrapNoResponse(hs.Index))
	r.Get("/live/pipeline", reqGrafanaAdmin, wrap.WrapNoResponse(hs.Index))
	r.Get("/live/cloud", reqGrafanaAdmin, wrap.WrapNoResponse(hs.Index))

	r.Get("/plugins", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/plugins/:id/", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/plugins/:id/edit", reqSignedIn, wrap.WrapNoResponse(hs.Index)) // deprecated
	r.Get("/plugins/:id/page/:page", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/a/:id/*", reqSignedIn, wrap.WrapNoResponse(hs.Index)) // App Root Page
	r.Get("/a/:id", reqSignedIn, wrap.WrapNoResponse(hs.Index))

	r.Get("/d/:uid/:slug", reqSignedIn, wrap.WrapNoResponse(redirectFromLegacyPanelEditURL), wrap.WrapNoResponse(hs.Index))
	r.Get("/d/:uid", reqSignedIn, wrap.WrapNoResponse(redirectFromLegacyPanelEditURL), wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboard/script/*", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboard/new", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboard-solo/snapshot/*", wrap.WrapNoResponse(hs.Index))
	r.Get("/d-solo/:uid/:slug", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/d-solo/:uid", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboard-solo/script/*", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/import/dashboard", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboards/", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboards/*", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/goto/:uid", reqSignedIn, wrap.WrapNoResponse(hs.redirectFromShortURL), wrap.WrapNoResponse(hs.Index))

	r.Get("/explore", authorize(wrap.WrapNoResponse(func(c *models.ReqContext) {
		reqSignedIn.ServeHTTP(c.Resp, c.Req)
		middleware.EnsureEditorOrViewerCanEdit(c)
	}), ac.EvalPermission(ac.ActionDatasourcesExplore)), wrap.WrapNoResponse(hs.Index))

	r.Get("/playlists/", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/playlists/*", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/alerting/", reqSignedIn, wrap.WrapNoResponse(hs.Index))
	r.Get("/alerting/*", reqSignedIn, wrap.WrapNoResponse(hs.Index))

	// sign up
	r.Get("/verify", wrap.WrapNoResponse(hs.Index))
	r.Get("/signup", wrap.WrapNoResponse(hs.Index))
	r.Get("/api/user/signup/options", wrap.Wrap(GetSignUpOptions))
	r.Post("/api/user/signup", quota("user"), wrap.Wrap(SignUp))
	r.Post("/api/user/signup/step2", wrap.Wrap(hs.SignUpStep2))

	// invited
	r.Get("/api/user/invite/:code", wrap.Wrap(GetInviteInfoByCode))
	r.Post("/api/user/invite/complete", wrap.Wrap(hs.CompleteInvite))

	// reset password
	r.Get("/user/password/send-reset-email", wrap.WrapNoResponse(reqNotSignedIn), wrap.WrapNoResponse(hs.Index))
	r.Get("/user/password/reset", wrap.WrapNoResponse(hs.Index))

	r.Post("/api/user/password/send-reset-email", wrap.Wrap(SendResetPasswordEmail))
	r.Post("/api/user/password/reset", wrap.Wrap(ResetPassword))

	// dashboard snapshots
	r.Get("/dashboard/snapshot/*", reqNoAuth, wrap.WrapNoResponse(hs.Index))
	r.Get("/dashboard/snapshots/", reqSignedIn, wrap.WrapNoResponse(hs.Index))

	// api renew session based on cookie
	r.Get("/api/login/ping", quota("session"), wrap.Wrap(hs.LoginAPIPing))

	// expose plugin file system assets
	r.Get("/public/plugins/:pluginId/*", wrap.WrapNoResponse(hs.getPluginAssets))

	// authed api
	r.Group("/api", func(apiRoute routing.RouteRegister) {
		// user (signed in)
		apiRoute.Group("/user", func(userRoute routing.RouteRegister) {
			userRoute.Get("/", wrap.Wrap(hs.GetSignedInUser))
			userRoute.Put("/", wrap.Wrap(UpdateSignedInUser))
			userRoute.Post("/using/:id", wrap.Wrap(UserSetUsingOrg))
			userRoute.Get("/orgs", wrap.Wrap(GetSignedInUserOrgList))
			userRoute.Get("/teams", wrap.Wrap(GetSignedInUserTeamList))

			userRoute.Post("/stars/dashboard/:id", wrap.Wrap(StarDashboard))
			userRoute.Delete("/stars/dashboard/:id", wrap.Wrap(UnstarDashboard))

			userRoute.Put("/password", wrap.Wrap(ChangeUserPassword))
			userRoute.Get("/quotas", wrap.Wrap(GetUserQuotas))
			userRoute.Put("/helpflags/:id", wrap.Wrap(SetHelpFlag))
			// For dev purpose
			userRoute.Get("/helpflags/clear", wrap.Wrap(ClearHelpFlags))

			userRoute.Get("/preferences", wrap.Wrap(hs.GetUserPreferences))
			userRoute.Put("/preferences", wrap.Wrap(hs.UpdateUserPreferences))

			userRoute.Get("/auth-tokens", wrap.Wrap(hs.GetUserAuthTokens))
			userRoute.Post("/revoke-auth-token", wrap.Wrap(hs.RevokeUserAuthToken))
		}, reqSignedInNoAnonymous)

		apiRoute.Group("/users", func(usersRoute routing.RouteRegister) {
			userIDScope := ac.Scope("global", "users", "id", ac.Parameter(":id"))
			usersRoute.Get("/", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead, ac.ScopeGlobalUsersAll)), wrap.Wrap(hs.searchUsersService.SearchUsers))
			usersRoute.Get("/search", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead, ac.ScopeGlobalUsersAll)), wrap.Wrap(hs.searchUsersService.SearchUsersWithPaging))
			usersRoute.Get("/:id", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead, userIDScope)), wrap.Wrap(hs.GetUserByID))
			usersRoute.Get("/:id/teams", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersTeamRead, userIDScope)), wrap.Wrap(GetUserTeams))
			usersRoute.Get("/:id/orgs", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead, userIDScope)), wrap.Wrap(GetUserOrgList))
			// query parameters /users/lookup?loginOrEmail=admin@example.com
			usersRoute.Get("/lookup", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersRead, ac.ScopeGlobalUsersAll)), wrap.Wrap(GetUserByLoginOrEmail))
			usersRoute.Put("/:id", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersWrite, userIDScope)), wrap.Wrap(UpdateUser))
			usersRoute.Post("/:id/using/:orgId", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersWrite, userIDScope)), wrap.Wrap(UpdateUserActiveOrg))
		})

		// team (admin permission required)
		apiRoute.Group("/teams", func(teamsRoute routing.RouteRegister) {
			teamsRoute.Post("/", authorize(reqCanAccessTeams, ac.EvalPermission(ActionTeamsCreate)), wrap.Wrap(hs.CreateTeam))
			teamsRoute.Put("/:teamId", reqCanAccessTeams, wrap.Wrap(hs.UpdateTeam))
			teamsRoute.Delete("/:teamId", reqCanAccessTeams, wrap.Wrap(hs.DeleteTeamByID))
			teamsRoute.Get("/:teamId/members", reqCanAccessTeams, wrap.Wrap(hs.GetTeamMembers))
			teamsRoute.Post("/:teamId/members", reqCanAccessTeams, wrap.Wrap(hs.AddTeamMember))
			teamsRoute.Put("/:teamId/members/:userId", reqCanAccessTeams, wrap.Wrap(hs.UpdateTeamMember))
			teamsRoute.Delete("/:teamId/members/:userId", reqCanAccessTeams, wrap.Wrap(hs.RemoveTeamMember))
			teamsRoute.Get("/:teamId/preferences", reqCanAccessTeams, wrap.Wrap(hs.GetTeamPreferences))
			teamsRoute.Put("/:teamId/preferences", reqCanAccessTeams, wrap.Wrap(hs.UpdateTeamPreferences))
		})

		// team without requirement of user to be org admin
		apiRoute.Group("/teams", func(teamsRoute routing.RouteRegister) {
			teamsRoute.Get("/:teamId", wrap.Wrap(hs.GetTeamByID))
			teamsRoute.Get("/search", wrap.Wrap(hs.SearchTeams))
		})

		// org information available to all users.
		apiRoute.Group("/org", func(orgRoute routing.RouteRegister) {
			orgRoute.Get("/", authorize(reqSignedIn, ac.EvalPermission(ActionOrgsRead)), wrap.Wrap(GetCurrentOrg))
			orgRoute.Get("/quotas", authorize(reqSignedIn, ac.EvalPermission(ActionOrgsQuotasRead)), wrap.Wrap(hs.GetCurrentOrgQuotas))
		})

		// current org
		apiRoute.Group("/org", func(orgRoute routing.RouteRegister) {
			userIDScope := ac.Scope("users", "id", ac.Parameter(":userId"))
			orgRoute.Put("/", authorize(reqOrgAdmin, ac.EvalPermission(ActionOrgsWrite)), wrap.Wrap(UpdateCurrentOrg))
			orgRoute.Put("/address", authorize(reqOrgAdmin, ac.EvalPermission(ActionOrgsWrite)), wrap.Wrap(UpdateCurrentOrgAddress))
			orgRoute.Get("/users", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionOrgUsersRead, ac.ScopeUsersAll)), wrap.Wrap(hs.GetOrgUsersForCurrentOrg))
			orgRoute.Get("/users/search", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionOrgUsersRead, ac.ScopeUsersAll)), wrap.Wrap(hs.SearchOrgUsersWithPaging))
			orgRoute.Post("/users", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionOrgUsersAdd, ac.ScopeUsersAll)), quota("user"), wrap.Wrap(hs.AddOrgUserToCurrentOrg))
			orgRoute.Patch("/users/:userId", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionOrgUsersRoleUpdate, userIDScope)), wrap.Wrap(hs.UpdateOrgUserForCurrentOrg))
			orgRoute.Delete("/users/:userId", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionOrgUsersRemove, userIDScope)), wrap.Wrap(hs.RemoveOrgUserForCurrentOrg))

			// invites
			orgRoute.Get("/invites", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionUsersCreate)), wrap.Wrap(GetPendingOrgInvites))
			orgRoute.Post("/invites", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionUsersCreate)), quota("user"), wrap.Wrap(AddOrgInvite))
			orgRoute.Patch("/invites/:code/revoke", authorize(reqOrgAdmin, ac.EvalPermission(ac.ActionUsersCreate)), wrap.Wrap(RevokeInvite))

			// prefs
			orgRoute.Get("/preferences", authorize(reqOrgAdmin, ac.EvalPermission(ActionOrgsPreferencesRead)), wrap.Wrap(hs.GetOrgPreferences))
			orgRoute.Put("/preferences", authorize(reqOrgAdmin, ac.EvalPermission(ActionOrgsPreferencesWrite)), wrap.Wrap(hs.UpdateOrgPreferences))
		})

		// current org without requirement of user to be org admin
		apiRoute.Group("/org", func(orgRoute routing.RouteRegister) {
			orgRoute.Get("/users/lookup", authorize(wrap.WrapNoResponse(reqOrgAdminFolderAdminOrTeamAdmin), ac.EvalPermission(ac.ActionOrgUsersRead, ac.ScopeUsersAll)), wrap.Wrap(hs.GetOrgUsersForCurrentOrgLookup))
		})

		// create new org
		apiRoute.Post("/orgs", authorizeInOrg(reqSignedIn, acmiddleware.UseGlobalOrg, ac.EvalPermission(ActionOrgsCreate)), quota("org"), wrap.Wrap(hs.CreateOrg))

		// search all orgs
		apiRoute.Get("/orgs", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseGlobalOrg, ac.EvalPermission(ActionOrgsRead)), wrap.Wrap(SearchOrgs))

		// orgs (admin routes)
		apiRoute.Group("/orgs/:orgId", func(orgsRoute routing.RouteRegister) {
			userIDScope := ac.Scope("users", "id", ac.Parameter(":userId"))
			orgsRoute.Get("/", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ActionOrgsRead)), wrap.Wrap(GetOrgByID))
			orgsRoute.Put("/", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ActionOrgsWrite)), wrap.Wrap(UpdateOrg))
			orgsRoute.Put("/address", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ActionOrgsWrite)), wrap.Wrap(UpdateOrgAddress))
			orgsRoute.Delete("/", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ActionOrgsDelete)), wrap.Wrap(DeleteOrgByID))
			orgsRoute.Get("/users", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ac.ActionOrgUsersRead, ac.ScopeUsersAll)), wrap.Wrap(hs.GetOrgUsers))
			orgsRoute.Post("/users", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ac.ActionOrgUsersAdd, ac.ScopeUsersAll)), wrap.Wrap(hs.AddOrgUser))
			orgsRoute.Patch("/users/:userId", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ac.ActionOrgUsersRoleUpdate, userIDScope)), wrap.Wrap(hs.UpdateOrgUser))
			orgsRoute.Delete("/users/:userId", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ac.ActionOrgUsersRemove, userIDScope)), wrap.Wrap(hs.RemoveOrgUser))
			orgsRoute.Get("/quotas", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ActionOrgsQuotasRead)), wrap.Wrap(hs.GetOrgQuotas))
			orgsRoute.Put("/quotas/:target", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseOrgFromContextParams, ac.EvalPermission(ActionOrgsQuotasWrite)), wrap.Wrap(hs.UpdateOrgQuota))
		})

		// orgs (admin routes)
		apiRoute.Get("/orgs/name/:name/", authorizeInOrg(reqGrafanaAdmin, acmiddleware.UseGlobalOrg, ac.EvalPermission(ActionOrgsRead)), wrap.Wrap(hs.GetOrgByName))

		// auth api keys
		apiRoute.Group("/auth/keys", func(keysRoute routing.RouteRegister) {
			keysRoute.Get("/", authorize(reqOrgAdmin, sa.ActionApikeyListEv), wrap.Wrap(GetAPIKeys))
			keysRoute.Post("/", authorize(reqOrgAdmin, sa.ActionApikeyAddEv), quota("api_key"), wrap.Wrap(hs.AddAPIKey))
			keysRoute.Post("/additional", authorize(reqOrgAdmin, sa.ActionApikeyAddAdditionalEv), quota("api_key"), wrap.Wrap(hs.AdditionalAPIKey))
			keysRoute.Delete("/:id", authorize(reqOrgAdmin, sa.ActionApikeyRemoveEv), wrap.Wrap(DeleteAPIKey))
		}, reqOrgAdmin)

		// Preferences
		apiRoute.Group("/preferences", func(prefRoute routing.RouteRegister) {
			prefRoute.Post("/set-home-dash", wrap.Wrap(SetHomeDashboard))
		})

		// Data sources
		apiRoute.Group("/datasources", func(datasourceRoute routing.RouteRegister) {
			datasourceRoute.Get("/", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesRead, ScopeDatasourcesAll)), wrap.Wrap(hs.GetDataSources))
			datasourceRoute.Post("/", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesCreate)), quota("data_source"), wrap.Wrap(AddDataSource))
			datasourceRoute.Put("/:id", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesWrite, ScopeDatasourceID)), wrap.Wrap(hs.UpdateDataSource))
			datasourceRoute.Delete("/:id", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesDelete, ScopeDatasourceID)), wrap.Wrap(hs.DeleteDataSourceById))
			datasourceRoute.Delete("/uid/:uid", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesDelete, ScopeDatasourceUID)), wrap.Wrap(hs.DeleteDataSourceByUID))
			datasourceRoute.Delete("/name/:name", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesDelete, ScopeDatasourceName)), wrap.Wrap(hs.DeleteDataSourceByName))
			datasourceRoute.Get("/:id", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesRead, ScopeDatasourceID)), wrap.Wrap(hs.GetDataSourceById))
			datasourceRoute.Get("/uid/:uid", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesRead, ScopeDatasourceUID)), wrap.Wrap(hs.GetDataSourceByUID))
			datasourceRoute.Get("/name/:name", authorize(reqOrgAdmin, ac.EvalPermission(ActionDatasourcesRead, ScopeDatasourceName)), wrap.Wrap(GetDataSourceByName))
		})

		apiRoute.Get("/datasources/id/:name", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesIDRead, ScopeDatasourceName)), wrap.Wrap(GetDataSourceIdByName))

		apiRoute.Get("/plugins", wrap.Wrap(hs.GetPluginList))
		apiRoute.Get("/plugins/:pluginId/settings", wrap.Wrap(hs.GetPluginSettingByID))
		apiRoute.Get("/plugins/:pluginId/markdown/:name", wrap.Wrap(hs.GetPluginMarkdown))
		apiRoute.Get("/plugins/:pluginId/health", wrap.Wrap(hs.CheckHealth))
		apiRoute.Any("/plugins/:pluginId/resources", wrap.WrapNoResponse(hs.CallResource))
		apiRoute.Any("/plugins/:pluginId/resources/*", wrap.WrapNoResponse(hs.CallResource))
		apiRoute.Get("/plugins/errors", wrap.Wrap(hs.GetPluginErrorsList))

		apiRoute.Group("/plugins", func(pluginRoute routing.RouteRegister) {
			pluginRoute.Post("/:pluginId/install", wrap.Wrap(hs.InstallPlugin))
			pluginRoute.Post("/:pluginId/uninstall", wrap.Wrap(hs.UninstallPlugin))
		}, reqGrafanaAdmin)

		apiRoute.Group("/plugins", func(pluginRoute routing.RouteRegister) {
			pluginRoute.Get("/:pluginId/dashboards/", wrap.Wrap(hs.GetPluginDashboards))
			pluginRoute.Post("/:pluginId/settings", wrap.Wrap(hs.UpdatePluginSetting))
			pluginRoute.Get("/:pluginId/metrics", wrap.Wrap(hs.CollectPluginMetrics))
		}, reqOrgAdmin)

		apiRoute.Get("/frontend/settings/", wrap.WrapNoResponse(hs.GetFrontendSettings))
		apiRoute.Any("/datasources/proxy/:id/*", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesQuery)), wrap.WrapNoResponse(hs.ProxyDataSourceRequest))
		apiRoute.Any("/datasources/proxy/:id", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesQuery)), wrap.WrapNoResponse(hs.ProxyDataSourceRequest))
		apiRoute.Any("/datasources/:id/resources", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesQuery)), wrap.WrapNoResponse(hs.CallDatasourceResource))
		apiRoute.Any("/datasources/:id/resources/*", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesQuery)), wrap.WrapNoResponse(hs.CallDatasourceResource))
		apiRoute.Any("/datasources/:id/health", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesQuery)), wrap.Wrap(hs.CheckDatasourceHealth))

		// Folders
		apiRoute.Group("/folders", func(folderRoute routing.RouteRegister) {
			folderRoute.Get("/", wrap.Wrap(hs.GetFolders))
			folderRoute.Get("/id/:id", wrap.Wrap(hs.GetFolderByID))
			folderRoute.Post("/", wrap.Wrap(hs.CreateFolder))

			folderRoute.Group("/:uid", func(folderUidRoute routing.RouteRegister) {
				folderUidRoute.Get("/", wrap.Wrap(hs.GetFolderByUID))
				folderUidRoute.Put("/", wrap.Wrap(hs.UpdateFolder))
				folderUidRoute.Delete("/", wrap.Wrap(hs.DeleteFolder))

				folderUidRoute.Group("/permissions", func(folderPermissionRoute routing.RouteRegister) {
					folderPermissionRoute.Get("/", wrap.Wrap(hs.GetFolderPermissionList))
					folderPermissionRoute.Post("/", wrap.Wrap(hs.UpdateFolderPermissions))
				})
			})
		})

		// Dashboard
		apiRoute.Group("/dashboards", func(dashboardRoute routing.RouteRegister) {
			dashboardRoute.Get("/uid/:uid", wrap.Wrap(hs.GetDashboard))
			dashboardRoute.Delete("/uid/:uid", wrap.Wrap(hs.DeleteDashboardByUID))

			if hs.ThumbService != nil {
				dashboardRoute.Get("/uid/:uid/img/:size/:theme", wrap.WrapNoResponse(hs.ThumbService.GetImage))
				dashboardRoute.Post("/uid/:uid/img/:size/:theme", wrap.WrapNoResponse(hs.ThumbService.SetImage))
			}

			dashboardRoute.Post("/calculate-diff", wrap.Wrap(CalculateDashboardDiff))
			dashboardRoute.Post("/trim", wrap.Wrap(hs.TrimDashboard))

			dashboardRoute.Post("/db", wrap.Wrap(hs.PostDashboard))
			dashboardRoute.Get("/home", wrap.Wrap(hs.GetHomeDashboard))
			dashboardRoute.Get("/tags", wrap.WrapNoResponse(GetDashboardTags))
			dashboardRoute.Post("/import", wrap.Wrap(hs.ImportDashboard))

			dashboardRoute.Group("/id/:dashboardId", func(dashIdRoute routing.RouteRegister) {
				dashIdRoute.Get("/versions", wrap.Wrap(GetDashboardVersions))
				dashIdRoute.Get("/versions/:id", wrap.Wrap(GetDashboardVersion))
				dashIdRoute.Post("/restore", wrap.Wrap(hs.RestoreDashboardVersion))

				dashIdRoute.Group("/permissions", func(dashboardPermissionRoute routing.RouteRegister) {
					dashboardPermissionRoute.Get("/", wrap.Wrap(hs.GetDashboardPermissionList))
					dashboardPermissionRoute.Post("/", wrap.Wrap(hs.UpdateDashboardPermissions))
				})
			})
		})

		// Dashboard snapshots
		apiRoute.Group("/dashboard/snapshots", func(dashboardRoute routing.RouteRegister) {
			dashboardRoute.Get("/", wrap.Wrap(SearchDashboardSnapshots))
		})

		// Playlist
		apiRoute.Group("/playlists", func(playlistRoute routing.RouteRegister) {
			playlistRoute.Get("/", wrap.Wrap(SearchPlaylists))
			playlistRoute.Get("/:id", wrap.WrapNoResponse(ValidateOrgPlaylist), wrap.Wrap(GetPlaylist))
			playlistRoute.Get("/:id/items", wrap.WrapNoResponse(ValidateOrgPlaylist), wrap.Wrap(GetPlaylistItems))
			playlistRoute.Get("/:id/dashboards", wrap.WrapNoResponse(ValidateOrgPlaylist), wrap.Wrap(GetPlaylistDashboards))
			playlistRoute.Delete("/:id", reqEditorRole, wrap.WrapNoResponse(ValidateOrgPlaylist), wrap.Wrap(DeletePlaylist))
			playlistRoute.Put("/:id", reqEditorRole, wrap.WrapNoResponse(ValidateOrgPlaylist), wrap.Wrap(UpdatePlaylist))
			playlistRoute.Post("/", reqEditorRole, wrap.Wrap(CreatePlaylist))
		})

		// Search
		apiRoute.Get("/search/sorting", wrap.Wrap(hs.ListSortOptions))
		apiRoute.Get("/search/", wrap.Wrap(Search))

		// metrics
		apiRoute.Post("/tsdb/query", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesQuery)), wrap.Wrap(hs.QueryMetrics))

		// DataSource w/ expressions
		apiRoute.Post("/ds/query", authorize(reqSignedIn, ac.EvalPermission(ActionDatasourcesQuery)), wrap.Wrap(hs.QueryMetricsV2))

		apiRoute.Group("/alerts", func(alertsRoute routing.RouteRegister) {
			alertsRoute.Post("/test", wrap.Wrap(hs.AlertTest))
			alertsRoute.Post("/:alertId/pause", reqEditorRole, wrap.Wrap(PauseAlert))
			alertsRoute.Get("/:alertId", wrap.WrapNoResponse(ValidateOrgAlert), wrap.Wrap(GetAlert))
			alertsRoute.Get("/", wrap.Wrap(GetAlerts))
			alertsRoute.Get("/states-for-dashboard", wrap.Wrap(GetAlertStatesForDashboard))
		})

		apiRoute.Get("/alert-notifiers", reqEditorRole, wrap.Wrap(
			GetAlertNotifiers(hs.Cfg.UnifiedAlerting.IsEnabled())),
		)

		apiRoute.Group("/alert-notifications", func(alertNotifications routing.RouteRegister) {
			alertNotifications.Get("/", wrap.Wrap(GetAlertNotifications))
			alertNotifications.Post("/test", wrap.Wrap(NotificationTest))
			alertNotifications.Post("/", wrap.Wrap(CreateAlertNotification))
			alertNotifications.Put("/:notificationId", wrap.Wrap(hs.UpdateAlertNotification))
			alertNotifications.Get("/:notificationId", wrap.Wrap(GetAlertNotificationByID))
			alertNotifications.Delete("/:notificationId", wrap.Wrap(DeleteAlertNotification))
			alertNotifications.Get("/uid/:uid", wrap.Wrap(GetAlertNotificationByUID))
			alertNotifications.Put("/uid/:uid", wrap.Wrap(hs.UpdateAlertNotificationByUID))
			alertNotifications.Delete("/uid/:uid", wrap.Wrap(DeleteAlertNotificationByUID))
		}, reqEditorRole)

		// alert notifications without requirement of user to be org editor
		apiRoute.Group("/alert-notifications", func(orgRoute routing.RouteRegister) {
			orgRoute.Get("/lookup", wrap.Wrap(GetAlertNotificationLookup))
		})

		apiRoute.Get("/annotations", wrap.Wrap(GetAnnotations))
		apiRoute.Post("/annotations/mass-delete", reqOrgAdmin, wrap.Wrap(DeleteAnnotations))

		apiRoute.Group("/annotations", func(annotationsRoute routing.RouteRegister) {
			annotationsRoute.Post("/", wrap.Wrap(PostAnnotation))
			annotationsRoute.Delete("/:annotationId", wrap.Wrap(DeleteAnnotationByID))
			annotationsRoute.Put("/:annotationId", wrap.Wrap(UpdateAnnotation))
			annotationsRoute.Patch("/:annotationId", wrap.Wrap(PatchAnnotation))
			annotationsRoute.Post("/graphite", reqEditorRole, wrap.Wrap(PostGraphiteAnnotation))
			annotationsRoute.Get("/tags", wrap.Wrap(GetAnnotationTags))
		})

		apiRoute.Post("/frontend-metrics", wrap.Wrap(hs.PostFrontendMetrics))

		apiRoute.Group("/live", func(liveRoute routing.RouteRegister) {
			// the channel path is in the name
			liveRoute.Post("/publish", wrap.Wrap(hs.Live.HandleHTTPPublish))

			// POST influx line protocol.
			liveRoute.Post("/push/:streamId", wrap.WrapNoResponse(hs.LivePushGateway.Handle))

			// List available streams and fields
			liveRoute.Get("/list", wrap.Wrap(hs.Live.HandleListHTTP))

			// Some channels may have info
			liveRoute.Get("/info/*", wrap.Wrap(hs.Live.HandleInfoHTTP))

			if hs.Cfg.FeatureToggles["live-pipeline"] {
				// POST Live data to be processed according to channel rules.
				liveRoute.Post("/pipeline/push/*", wrap.WrapNoResponse(hs.LivePushGateway.HandlePipelinePush))
				liveRoute.Post("/pipeline-convert-test", wrap.Wrap(hs.Live.HandlePipelineConvertTestHTTP), reqOrgAdmin)
				liveRoute.Get("/pipeline-entities", wrap.Wrap(hs.Live.HandlePipelineEntitiesListHTTP), reqOrgAdmin)
				liveRoute.Get("/channel-rules", wrap.Wrap(hs.Live.HandleChannelRulesListHTTP), reqOrgAdmin)
				liveRoute.Post("/channel-rules", wrap.Wrap(hs.Live.HandleChannelRulesPostHTTP), reqOrgAdmin)
				liveRoute.Put("/channel-rules", wrap.Wrap(hs.Live.HandleChannelRulesPutHTTP), reqOrgAdmin)
				liveRoute.Delete("/channel-rules", wrap.Wrap(hs.Live.HandleChannelRulesDeleteHTTP), reqOrgAdmin)
				liveRoute.Get("/write-configs", wrap.Wrap(hs.Live.HandleWriteConfigsListHTTP), reqOrgAdmin)
				liveRoute.Post("/write-configs", wrap.Wrap(hs.Live.HandleWriteConfigsPostHTTP), reqOrgAdmin)
				liveRoute.Put("/write-configs", wrap.Wrap(hs.Live.HandleWriteConfigsPutHTTP), reqOrgAdmin)
				liveRoute.Delete("/write-configs", wrap.Wrap(hs.Live.HandleWriteConfigsDeleteHTTP), reqOrgAdmin)
			}
		})

		// short urls
		apiRoute.Post("/short-urls", wrap.Wrap(hs.createShortURL))
	}, reqSignedIn)

	// admin api
	r.Group("/api/admin", func(adminRoute routing.RouteRegister) {
		adminRoute.Get("/settings", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionSettingsRead)), wrap.Wrap(hs.AdminGetSettings))
		adminRoute.Get("/stats", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionServerStatsRead)), wrap.Wrap(AdminGetStats))
		adminRoute.Post("/pause-all-alerts", reqGrafanaAdmin, wrap.Wrap(PauseAllAlerts))

		if hs.ThumbService != nil {
			adminRoute.Post("/crawler/start", reqGrafanaAdmin, wrap.Wrap(hs.ThumbService.StartCrawler))
			adminRoute.Post("/crawler/stop", reqGrafanaAdmin, wrap.Wrap(hs.ThumbService.StopCrawler))
			adminRoute.Get("/crawler/status", reqGrafanaAdmin, wrap.Wrap(hs.ThumbService.CrawlerStatus))
		}

		adminRoute.Post("/provisioning/dashboards/reload", authorize(reqGrafanaAdmin, ac.EvalPermission(ActionProvisioningReload, ScopeProvisionersDashboards)), wrap.Wrap(hs.AdminProvisioningReloadDashboards))
		adminRoute.Post("/provisioning/plugins/reload", authorize(reqGrafanaAdmin, ac.EvalPermission(ActionProvisioningReload, ScopeProvisionersPlugins)), wrap.Wrap(hs.AdminProvisioningReloadPlugins))
		adminRoute.Post("/provisioning/datasources/reload", authorize(reqGrafanaAdmin, ac.EvalPermission(ActionProvisioningReload, ScopeProvisionersDatasources)), wrap.Wrap(hs.AdminProvisioningReloadDatasources))
		adminRoute.Post("/provisioning/notifications/reload", authorize(reqGrafanaAdmin, ac.EvalPermission(ActionProvisioningReload, ScopeProvisionersNotifications)), wrap.Wrap(hs.AdminProvisioningReloadNotifications))

		adminRoute.Post("/ldap/reload", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionLDAPConfigReload)), wrap.Wrap(hs.ReloadLDAPCfg))
		adminRoute.Post("/ldap/sync/:id", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionLDAPUsersSync)), wrap.Wrap(hs.PostSyncUserWithLDAP))
		adminRoute.Get("/ldap/:username", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionLDAPUsersRead)), wrap.Wrap(hs.GetUserFromLDAP))
		adminRoute.Get("/ldap/status", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionLDAPStatusRead)), wrap.Wrap(hs.GetLDAPStatus))
	})

	// Administering users
	r.Group("/api/admin/users", func(adminUserRoute routing.RouteRegister) {
		userIDScope := ac.Scope("global", "users", "id", ac.Parameter(":id"))

		adminUserRoute.Post("/", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersCreate)), wrap.Wrap(hs.AdminCreateUser))
		adminUserRoute.Put("/:id/password", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersPasswordUpdate, userIDScope)), wrap.Wrap(AdminUpdateUserPassword))
		adminUserRoute.Put("/:id/permissions", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersPermissionsUpdate, userIDScope)), wrap.Wrap(hs.AdminUpdateUserPermissions))
		adminUserRoute.Delete("/:id", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersDelete, userIDScope)), wrap.Wrap(AdminDeleteUser))
		adminUserRoute.Post("/:id/disable", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersDisable, userIDScope)), wrap.Wrap(hs.AdminDisableUser))
		adminUserRoute.Post("/:id/enable", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersEnable, userIDScope)), wrap.Wrap(AdminEnableUser))
		adminUserRoute.Get("/:id/quotas", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersQuotasList, userIDScope)), wrap.Wrap(GetUserQuotas))
		adminUserRoute.Put("/:id/quotas/:target", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersQuotasUpdate, userIDScope)), wrap.Wrap(UpdateUserQuota))

		adminUserRoute.Post("/:id/logout", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersLogout, userIDScope)), wrap.Wrap(hs.AdminLogoutUser))
		adminUserRoute.Get("/:id/auth-tokens", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersAuthTokenList, userIDScope)), wrap.Wrap(hs.AdminGetUserAuthTokens))
		adminUserRoute.Post("/:id/revoke-auth-token", authorize(reqGrafanaAdmin, ac.EvalPermission(ac.ActionUsersAuthTokenUpdate, userIDScope)), wrap.Wrap(hs.AdminRevokeUserAuthToken))
	})

	// rendering
	r.Get("/render/*", reqSignedIn, wrap.WrapNoResponse(hs.RenderToPng))

	// grafana.net proxy
	r.Any("/api/gnet/*", reqSignedIn, wrap.WrapNoResponse(hs.ProxyGnetRequest))

	// Gravatar service.
	avatarCacheServer := avatar.NewCacheServer(hs.Cfg)
	r.Get("/avatar/:hash", wrap.WrapNoResponse(avatarCacheServer.Handler))

	// Snapshots
	r.Post("/api/snapshots/", reqSnapshotPublicModeOrSignedIn, wrap.Wrap(CreateDashboardSnapshot))
	r.Get("/api/snapshot/shared-options/", reqSignedIn, wrap.WrapNoResponse(GetSharingOptions))
	r.Get("/api/snapshots/:key", wrap.Wrap(GetDashboardSnapshot))
	r.Get("/api/snapshots-delete/:deleteKey", reqSnapshotPublicModeOrSignedIn, wrap.Wrap(DeleteDashboardSnapshotByDeleteKey))
	r.Delete("/api/snapshots/:key", reqEditorRole, wrap.Wrap(DeleteDashboardSnapshot))

	// Frontend logs
	sourceMapStore := frontendlogging.NewSourceMapStore(hs.Cfg, hs.pluginStaticRouteResolver, frontendlogging.ReadSourceMapFromFS)
	r.Post("/log", middleware.RateLimit(hs.Cfg.Sentry.EndpointRPS, hs.Cfg.Sentry.EndpointBurst, time.Now),
		wrap.Wrap(NewFrontendLogMessageHandler(sourceMapStore)))
}
