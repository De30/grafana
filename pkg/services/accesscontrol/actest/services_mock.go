package actest

import (
	"context"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/stretchr/testify/mock"
)

var _ accesscontrol.PermissionsServices = new(PermissionsServicesMock)

func NewPermissionsServicesMock() *PermissionsServicesMock {
	return &PermissionsServicesMock{
		Teams:       &MockPermissionsService{},
		Folders:     &MockPermissionsService{},
		Dashboards:  &MockPermissionsService{},
		Datasources: &MockPermissionsService{},
	}
}

type PermissionsServicesMock struct {
	Teams       *MockPermissionsService
	Folders     *MockPermissionsService
	Dashboards  *MockPermissionsService
	Datasources *MockPermissionsService
}

func (p PermissionsServicesMock) GetTeamService() accesscontrol.PermissionsService {
	return p.Teams
}

func (p PermissionsServicesMock) GetFolderService() accesscontrol.PermissionsService {
	return p.Folders
}

func (p PermissionsServicesMock) GetDashboardService() accesscontrol.PermissionsService {
	return p.Dashboards
}

func (p PermissionsServicesMock) GetDataSourceService() accesscontrol.PermissionsService {
	return p.Datasources
}

var _ accesscontrol.PermissionsService = new(MockPermissionsService)

type MockPermissionsService struct {
	mock.Mock
}

func (m *MockPermissionsService) GetPermissions(ctx context.Context, user *models.SignedInUser, resourceID string) ([]accesscontrol.ResourcePermission, error) {
	mockedArgs := m.Called(ctx, user, resourceID)
	return mockedArgs.Get(0).([]accesscontrol.ResourcePermission), mockedArgs.Error(1)
}

func (m *MockPermissionsService) SetUserPermission(ctx context.Context, orgID int64, user accesscontrol.User, resourceID, permission string) (*accesscontrol.ResourcePermission, error) {
	mockedArgs := m.Called(ctx, orgID, user, resourceID, permission)
	return mockedArgs.Get(0).(*accesscontrol.ResourcePermission), mockedArgs.Error(1)
}

func (m *MockPermissionsService) SetTeamPermission(ctx context.Context, orgID, teamID int64, resourceID, permission string) (*accesscontrol.ResourcePermission, error) {
	mockedArgs := m.Called(ctx, orgID, teamID, resourceID, permission)
	return mockedArgs.Get(0).(*accesscontrol.ResourcePermission), mockedArgs.Error(1)
}

func (m *MockPermissionsService) SetBuiltInRolePermission(ctx context.Context, orgID int64, builtInRole, resourceID, permission string) (*accesscontrol.ResourcePermission, error) {
	mockedArgs := m.Called(ctx, orgID, builtInRole, resourceID, permission)
	return mockedArgs.Get(0).(*accesscontrol.ResourcePermission), mockedArgs.Error(1)
}

func (m *MockPermissionsService) SetPermissions(ctx context.Context, orgID int64, resourceID string, commands ...accesscontrol.SetResourcePermissionCommand) ([]accesscontrol.ResourcePermission, error) {
	mockedArgs := m.Called(ctx, orgID, resourceID, commands)
	return mockedArgs.Get(0).([]accesscontrol.ResourcePermission), mockedArgs.Error(1)
}

func (m *MockPermissionsService) MapActions(permission accesscontrol.ResourcePermission) string {
	mockedArgs := m.Called(permission)
	return mockedArgs.Get(0).(string)
}
