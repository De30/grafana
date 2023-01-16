package guardian

import (
	"context"
	"errors"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/dashboards"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/team"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util/errutil"
)

var (
	ErrGuardianPermissionExists    = errors.New("permission already exists")
	ErrGuardianOverride            = errors.New("you can only override a permission to be higher")
	ErrGuardianGetDashboardFailure = errutil.NewBase(errutil.StatusInternal, "guardian.getDashboardFailure", errutil.WithPublicMessage("Failed to get dashboard"))
	ErrGuardianDashboardNotFound   = errutil.NewBase(errutil.StatusNotFound, "guardian.dashboardNotFound")
)

// DashboardGuardian to be used for guard against operations without access on dashboard and acl
type DashboardGuardian interface {
	CanSave() (bool, error)
	CanEdit() (bool, error)
	CanView() (bool, error)
	CanAdmin() (bool, error)
	CanDelete() (bool, error)
	CanCreate(folderID int64, isFolder bool) (bool, error)
	CheckPermissionBeforeUpdate(permission models.PermissionType, updatePermissions []*models.DashboardACL) (bool, error)

	// GetACL returns ACL.
	GetACL() ([]*models.DashboardACLInfoDTO, error)

	// GetACLWithoutDuplicates returns ACL and strips any permission
	// that already has an inherited permission with higher or equal
	// permission.
	GetACLWithoutDuplicates() ([]*models.DashboardACLInfoDTO, error)
	GetHiddenACL(*setting.Cfg) ([]*models.DashboardACL, error)
}

type dashboardGuardianImpl struct {
	user             *user.SignedInUser
	dashId           int64
	orgId            int64
	acl              []*models.DashboardACLInfoDTO
	teams            []*team.TeamDTO
	log              log.Logger
	ctx              context.Context
	store            db.DB
	dashboardService dashboards.DashboardService
	teamService      team.Service
}

// New factory for creating a new dashboard guardian instance
// When using access control this function is replaced on startup and the AccessControlDashboardGuardian is returned
var New = func(ctx context.Context, dashId int64, orgId int64, user *user.SignedInUser) (DashboardGuardian, error) {
	panic("no guardian factory implementation provided")
}

// NewByUID factory for creating a new dashboard guardian instance
// When using access control this function is replaced on startup and the AccessControlDashboardGuardian is returned
var NewByUID = func(ctx context.Context, dashUID string, orgId int64, user *user.SignedInUser) (DashboardGuardian, error) {
	panic("no guardian factory implementation provided")
}

// NewByDashboard factory for creating a new dashboard guardian instance
// When using access control this function is replaced on startup and the AccessControlDashboardGuardian is returned
var NewByDashboard = func(ctx context.Context, dash *models.Dashboard, orgId int64, user *user.SignedInUser) (DashboardGuardian, error) {
	panic("no guardian factory implementation provided")
}

// newDashboardGuardian creates a dashboard guardian by the provided dashId.
func newDashboardGuardian(ctx context.Context, dashId int64, orgId int64, user *user.SignedInUser, store db.DB, dashSvc dashboards.DashboardService, teamSvc team.Service) (*dashboardGuardianImpl, error) {
	if dashId != 0 {
		q := &models.GetDashboardQuery{
			Id:    dashId,
			OrgId: orgId,
		}

		if err := dashSvc.GetDashboard(ctx, q); err != nil {
			if errors.Is(err, dashboards.ErrDashboardNotFound) {
				return nil, ErrGuardianDashboardNotFound.Errorf("failed to get dashboard by UID: %w", err)
			}
			return nil, ErrGuardianGetDashboardFailure.Errorf("failed to get dashboard by UID: %w", err)
		}
	}

	return &dashboardGuardianImpl{
		user:             user,
		dashId:           dashId,
		orgId:            orgId,
		log:              log.New("dashboard.permissions"),
		ctx:              ctx,
		store:            store,
		dashboardService: dashSvc,
		teamService:      teamSvc,
	}, nil
}

// newDashboardGuardianByUID creates a dashboard guardian by the provided dashUID.
func newDashboardGuardianByUID(ctx context.Context, dashUID string, orgId int64, user *user.SignedInUser, store db.DB, dashSvc dashboards.DashboardService, teamSvc team.Service) (*dashboardGuardianImpl, error) {
	dashID := int64(0)
	if dashUID != "" {
		q := &models.GetDashboardQuery{
			Uid:   dashUID,
			OrgId: orgId,
		}

		if err := dashSvc.GetDashboard(ctx, q); err != nil {
			if errors.Is(err, dashboards.ErrDashboardNotFound) {
				return nil, ErrGuardianDashboardNotFound.Errorf("failed to get dashboard by UID: %w", err)
			}
			return nil, ErrGuardianGetDashboardFailure.Errorf("failed to get dashboard by UID: %w", err)
		}
		dashID = q.Result.Id
	}

	return &dashboardGuardianImpl{
		user:             user,
		dashId:           dashID,
		orgId:            orgId,
		log:              log.New("dashboard.permissions"),
		ctx:              ctx,
		store:            store,
		dashboardService: dashSvc,
		teamService:      teamSvc,
	}, nil
}

// newDashboardGuardianByDashboard creates a dashboard guardian by the provided dashboard.
// This constructor should be preferred over the other two if the dashboard in available
// since it avoids querying the database for fetching the dashboard.
func newDashboardGuardianByDashboard(ctx context.Context, dash *models.Dashboard, orgId int64, user *user.SignedInUser, store db.DB, dashSvc dashboards.DashboardService, teamSvc team.Service) (*dashboardGuardianImpl, error) {
	return &dashboardGuardianImpl{
		user:             user,
		dashId:           dash.Id,
		orgId:            orgId,
		log:              log.New("dashboard.permissions"),
		ctx:              ctx,
		store:            store,
		dashboardService: dashSvc,
		teamService:      teamSvc,
	}, nil
}

func (g *dashboardGuardianImpl) CanSave() (bool, error) {
	return g.HasPermission(models.PERMISSION_EDIT)
}

func (g *dashboardGuardianImpl) CanEdit() (bool, error) {
	if setting.ViewersCanEdit {
		return g.HasPermission(models.PERMISSION_VIEW)
	}

	return g.HasPermission(models.PERMISSION_EDIT)
}

func (g *dashboardGuardianImpl) CanView() (bool, error) {
	return g.HasPermission(models.PERMISSION_VIEW)
}

func (g *dashboardGuardianImpl) CanAdmin() (bool, error) {
	return g.HasPermission(models.PERMISSION_ADMIN)
}

func (g *dashboardGuardianImpl) CanDelete() (bool, error) {
	// when using dashboard guardian without access control a user can delete a dashboard if they can save it
	return g.CanSave()
}

func (g *dashboardGuardianImpl) CanCreate(_ int64, _ bool) (bool, error) {
	// when using dashboard guardian without access control a user can create a dashboard if they can save it
	return g.CanSave()
}

func (g *dashboardGuardianImpl) HasPermission(permission models.PermissionType) (bool, error) {
	if g.user.OrgRole == org.RoleAdmin {
		return g.logHasPermissionResult(permission, true, nil)
	}

	acl, err := g.GetACL()
	if err != nil {
		return g.logHasPermissionResult(permission, false, err)
	}

	result, err := g.checkACL(permission, acl)
	return g.logHasPermissionResult(permission, result, err)
}

func (g *dashboardGuardianImpl) logHasPermissionResult(permission models.PermissionType, hasPermission bool, err error) (bool, error) {
	if err != nil {
		return hasPermission, err
	}

	if hasPermission {
		g.log.Debug("User granted access to execute action", "userId", g.user.UserID, "orgId", g.orgId, "uname", g.user.Login, "dashId", g.dashId, "action", permission)
	} else {
		g.log.Debug("User denied access to execute action", "userId", g.user.UserID, "orgId", g.orgId, "uname", g.user.Login, "dashId", g.dashId, "action", permission)
	}

	return hasPermission, err
}

func (g *dashboardGuardianImpl) checkACL(permission models.PermissionType, acl []*models.DashboardACLInfoDTO) (bool, error) {
	orgRole := g.user.OrgRole
	teamACLItems := []*models.DashboardACLInfoDTO{}

	for _, p := range acl {
		// user match
		if !g.user.IsAnonymous && p.UserId > 0 {
			if p.UserId == g.user.UserID && p.Permission >= permission {
				return true, nil
			}
		}

		// role match
		if p.Role != nil {
			if *p.Role == orgRole && p.Permission >= permission {
				return true, nil
			}
		}

		// remember this rule for later
		if p.TeamId > 0 {
			teamACLItems = append(teamACLItems, p)
		}
	}

	// do we have team rules?
	if len(teamACLItems) == 0 {
		return false, nil
	}

	// load teams
	teams, err := g.getTeams()
	if err != nil {
		return false, err
	}

	// evaluate team rules
	for _, p := range acl {
		for _, ug := range teams {
			if ug.ID == p.TeamId && p.Permission >= permission {
				return true, nil
			}
		}
	}

	return false, nil
}

func (g *dashboardGuardianImpl) CheckPermissionBeforeUpdate(permission models.PermissionType, updatePermissions []*models.DashboardACL) (bool, error) {
	acl := []*models.DashboardACLInfoDTO{}
	adminRole := org.RoleAdmin
	everyoneWithAdminRole := &models.DashboardACLInfoDTO{DashboardId: g.dashId, UserId: 0, TeamId: 0, Role: &adminRole, Permission: models.PERMISSION_ADMIN}

	// validate that duplicate permissions don't exists
	for _, p := range updatePermissions {
		aclItem := &models.DashboardACLInfoDTO{DashboardId: p.DashboardID, UserId: p.UserID, TeamId: p.TeamID, Role: p.Role, Permission: p.Permission}
		if aclItem.IsDuplicateOf(everyoneWithAdminRole) {
			return false, ErrGuardianPermissionExists
		}

		for _, a := range acl {
			if a.IsDuplicateOf(aclItem) {
				return false, ErrGuardianPermissionExists
			}
		}

		acl = append(acl, aclItem)
	}

	existingPermissions, err := g.GetACL()
	if err != nil {
		return false, err
	}

	// validate overridden permissions to be higher
	for _, a := range acl {
		for _, existingPerm := range existingPermissions {
			if !existingPerm.Inherited {
				continue
			}

			if a.IsDuplicateOf(existingPerm) && a.Permission <= existingPerm.Permission {
				return false, ErrGuardianOverride
			}
		}
	}

	if g.user.OrgRole == org.RoleAdmin {
		return true, nil
	}

	return g.checkACL(permission, existingPermissions)
}

// GetACL returns dashboard acl
func (g *dashboardGuardianImpl) GetACL() ([]*models.DashboardACLInfoDTO, error) {
	if g.acl != nil {
		return g.acl, nil
	}

	query := models.GetDashboardACLInfoListQuery{DashboardID: g.dashId, OrgID: g.orgId}
	if err := g.dashboardService.GetDashboardACLInfoList(g.ctx, &query); err != nil {
		return nil, err
	}
	g.acl = query.Result
	return g.acl, nil
}

func (g *dashboardGuardianImpl) GetACLWithoutDuplicates() ([]*models.DashboardACLInfoDTO, error) {
	acl, err := g.GetACL()
	if err != nil {
		return nil, err
	}

	nonInherited := []*models.DashboardACLInfoDTO{}
	inherited := []*models.DashboardACLInfoDTO{}
	for _, aclItem := range acl {
		if aclItem.Inherited {
			inherited = append(inherited, aclItem)
		} else {
			nonInherited = append(nonInherited, aclItem)
		}
	}

	result := []*models.DashboardACLInfoDTO{}
	for _, nonInheritedACLItem := range nonInherited {
		duplicate := false
		for _, inheritedACLItem := range inherited {
			if nonInheritedACLItem.IsDuplicateOf(inheritedACLItem) && nonInheritedACLItem.Permission <= inheritedACLItem.Permission {
				duplicate = true
				break
			}
		}

		if !duplicate {
			result = append(result, nonInheritedACLItem)
		}
	}

	result = append(inherited, result...)

	return result, nil
}

func (g *dashboardGuardianImpl) getTeams() ([]*team.TeamDTO, error) {
	if g.teams != nil {
		return g.teams, nil
	}

	query := team.GetTeamsByUserQuery{OrgID: g.orgId, UserID: g.user.UserID, SignedInUser: g.user}
	queryResult, err := g.teamService.GetTeamsByUser(g.ctx, &query)

	g.teams = queryResult
	return queryResult, err
}

func (g *dashboardGuardianImpl) GetHiddenACL(cfg *setting.Cfg) ([]*models.DashboardACL, error) {
	hiddenACL := make([]*models.DashboardACL, 0)
	if g.user.IsGrafanaAdmin {
		return hiddenACL, nil
	}

	existingPermissions, err := g.GetACL()
	if err != nil {
		return hiddenACL, err
	}

	for _, item := range existingPermissions {
		if item.Inherited || item.UserLogin == g.user.Login {
			continue
		}

		if _, hidden := cfg.HiddenUsers[item.UserLogin]; hidden {
			hiddenACL = append(hiddenACL, &models.DashboardACL{
				OrgID:       item.OrgId,
				DashboardID: item.DashboardId,
				UserID:      item.UserId,
				TeamID:      item.TeamId,
				Role:        item.Role,
				Permission:  item.Permission,
				Created:     item.Created,
				Updated:     item.Updated,
			})
		}
	}
	return hiddenACL, nil
}

// nolint:unused
type FakeDashboardGuardian struct {
	DashID                           int64
	DashUID                          string
	OrgId                            int64
	User                             *user.SignedInUser
	CanSaveValue                     bool
	CanEditValue                     bool
	CanViewValue                     bool
	CanAdminValue                    bool
	HasPermissionValue               bool
	CheckPermissionBeforeUpdateValue bool
	CheckPermissionBeforeUpdateError error
	GetACLValue                      []*models.DashboardACLInfoDTO
	GetHiddenACLValue                []*models.DashboardACL
}

func (g *FakeDashboardGuardian) CanSave() (bool, error) {
	return g.CanSaveValue, nil
}

func (g *FakeDashboardGuardian) CanEdit() (bool, error) {
	return g.CanEditValue, nil
}

func (g *FakeDashboardGuardian) CanView() (bool, error) {
	return g.CanViewValue, nil
}

func (g *FakeDashboardGuardian) CanAdmin() (bool, error) {
	return g.CanAdminValue, nil
}

func (g *FakeDashboardGuardian) CanDelete() (bool, error) {
	return g.CanSaveValue, nil
}

func (g *FakeDashboardGuardian) CanCreate(_ int64, _ bool) (bool, error) {
	return g.CanSaveValue, nil
}

func (g *FakeDashboardGuardian) HasPermission(permission models.PermissionType) (bool, error) {
	return g.HasPermissionValue, nil
}

func (g *FakeDashboardGuardian) CheckPermissionBeforeUpdate(permission models.PermissionType, updatePermissions []*models.DashboardACL) (bool, error) {
	return g.CheckPermissionBeforeUpdateValue, g.CheckPermissionBeforeUpdateError
}

func (g *FakeDashboardGuardian) GetACL() ([]*models.DashboardACLInfoDTO, error) {
	return g.GetACLValue, nil
}

func (g *FakeDashboardGuardian) GetACLWithoutDuplicates() ([]*models.DashboardACLInfoDTO, error) {
	return g.GetACL()
}

func (g *FakeDashboardGuardian) GetHiddenACL(cfg *setting.Cfg) ([]*models.DashboardACL, error) {
	return g.GetHiddenACLValue, nil
}

// nolint:unused
func MockDashboardGuardian(mock *FakeDashboardGuardian) {
	New = func(_ context.Context, dashID int64, orgId int64, user *user.SignedInUser) (DashboardGuardian, error) {
		mock.OrgId = orgId
		mock.DashID = dashID
		mock.User = user
		return mock, nil
	}

	NewByUID = func(_ context.Context, dashUID string, orgId int64, user *user.SignedInUser) (DashboardGuardian, error) {
		mock.OrgId = orgId
		mock.DashUID = dashUID
		mock.User = user
		return mock, nil
	}

	NewByDashboard = func(_ context.Context, dash *models.Dashboard, orgId int64, user *user.SignedInUser) (DashboardGuardian, error) {
		mock.OrgId = orgId
		mock.DashUID = dash.Uid
		mock.DashID = dash.Id
		mock.User = user
		return mock, nil
	}
}
