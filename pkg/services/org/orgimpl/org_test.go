package orgimpl

import (
	"context"
	"testing"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/team/teamimpl"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/services/user/userimpl"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/stretchr/testify/require"
)

func TestOrgService(t *testing.T) {
	orgStore := newOrgStoreFake()
	orgService := Service{
		store: orgStore,
		cfg:   setting.NewCfg(),
	}

	t.Run("create org", func(t *testing.T) {
		_, err := orgService.GetIDForNewUser(context.Background(), org.GetOrgIDForNewUserCommand{})
		require.NoError(t, err)
	})

	t.Run("create org", func(t *testing.T) {
		_, err := orgService.GetIDForNewUser(context.Background(), org.GetOrgIDForNewUserCommand{})
		require.NoError(t, err)
	})

	t.Run("create org with auto assign org ID", func(t *testing.T) {
		setting.AutoAssignOrg = true
		setting.AutoAssignOrgId = 1
		orgStore.ExpectedOrgID = 1
		orgStore.ExpectedOrg = &org.Org{}
		_, err := orgService.GetIDForNewUser(context.Background(), org.GetOrgIDForNewUserCommand{})
		require.NoError(t, err)
	})

	t.Run("create org with auto assign org ID and orgID", func(t *testing.T) {
		setting.AutoAssignOrg = true
		setting.AutoAssignOrgId = 1
		orgStore.ExpectedOrgID = 1
		orgStore.ExpectedOrg = &org.Org{}
		_, err := orgService.GetIDForNewUser(context.Background(), org.GetOrgIDForNewUserCommand{OrgID: 1})
		require.NoError(t, err)
	})

	setting.AutoAssignOrg = false
	setting.AutoAssignOrgId = 0

	t.Run("delete user from all orgs", func(t *testing.T) {
		err := orgService.DeleteUserFromAll(context.Background(), 1)
		require.NoError(t, err)
	})
}

func TestAddOrgUser(t *testing.T) {
	var orgID int64 = 1
	testdb := db.InitTestDB(t)
	orgsvc := ProvideService(testdb, testdb.Cfg)
	teamsvc := teamimpl.ProvideService(testdb, testdb.Cfg)
	usersvc := userimpl.ProvideService(testdb, orgsvc, testdb.Cfg, teamsvc, nil)

	// create org and admin
	_, err := usersvc.Create(context.Background(), &user.CreateUserCommand{
		Login: "admin",
		OrgID: orgID,
	})
	require.NoError(t, err)

	// create a service account with no org
	sa, err := usersvc.Create(context.Background(), &user.CreateUserCommand{
		Login:            "sa-no-org",
		IsServiceAccount: true,
		SkipOrgSetup:     true,
	})

	require.NoError(t, err)
	require.Equal(t, int64(-1), sa.OrgID)

	// assign the sa to the org but without the override. should fail
	err = orgsvc.AddOrgUser(context.Background(), &org.AddOrgUserCommand{
		Role:   "Viewer",
		OrgID:  orgID,
		UserID: sa.ID,
	})
	require.Error(t, err)

	// assign the sa to the org with the override. should succeed
	err = orgsvc.AddOrgUser(context.Background(), &org.AddOrgUserCommand{
		Role:                      "Viewer",
		OrgID:                     orgID,
		UserID:                    sa.ID,
		AllowAddingServiceAccount: true,
	})

	require.NoError(t, err)

	// assert the org has been correctly set
	saFound := new(user.User)
	err = testdb.WithDbSession(context.Background(), func(sess *db.Session) error {
		has, err := sess.ID(sa.ID).Get(saFound)
		if err != nil {
			return err
		} else if !has {
			return user.ErrUserNotFound
		}
		return nil
	})

	require.NoError(t, err)
	require.Equal(t, saFound.OrgID, orgID)
}

type FakeOrgStore struct {
	ExpectedOrg                       *org.Org
	ExpectedOrgID                     int64
	ExpectedUserID                    int64
	ExpectedError                     error
	ExpectedUserOrgs                  []*org.UserOrgDTO
	ExpectedOrgs                      []*org.OrgDTO
	ExpectedOrgUsers                  []*org.OrgUserDTO
	ExpectedSearchOrgUsersQueryResult *org.SearchOrgUsersQueryResult
}

func newOrgStoreFake() *FakeOrgStore {
	return &FakeOrgStore{}
}

func (f *FakeOrgStore) Get(ctx context.Context, orgID int64) (*org.Org, error) {
	return f.ExpectedOrg, f.ExpectedError
}

func (f *FakeOrgStore) Insert(ctx context.Context, org *org.Org) (int64, error) {
	return f.ExpectedOrgID, f.ExpectedError
}

func (f *FakeOrgStore) InsertOrgUser(ctx context.Context, org *org.OrgUser) (int64, error) {
	return f.ExpectedUserID, f.ExpectedError
}

func (f *FakeOrgStore) DeleteUserFromAll(ctx context.Context, userID int64) error {
	return f.ExpectedError
}

func (f *FakeOrgStore) Update(ctx context.Context, cmd *org.UpdateOrgCommand) error {
	return f.ExpectedError
}

func (f *FakeOrgStore) UpdateAddress(ctx context.Context, cmd *org.UpdateOrgAddressCommand) error {
	return f.ExpectedError
}

func (f *FakeOrgStore) Delete(ctx context.Context, cmd *org.DeleteOrgCommand) error {
	return f.ExpectedError
}

func (f *FakeOrgStore) GetUserOrgList(ctx context.Context, query *org.GetUserOrgListQuery) ([]*org.UserOrgDTO, error) {
	return f.ExpectedUserOrgs, f.ExpectedError
}

func (f *FakeOrgStore) Search(ctx context.Context, query *org.SearchOrgsQuery) ([]*org.OrgDTO, error) {
	return f.ExpectedOrgs, f.ExpectedError
}

func (f *FakeOrgStore) CreateWithMember(ctx context.Context, cmd *org.CreateOrgCommand) (*org.Org, error) {
	return f.ExpectedOrg, f.ExpectedError
}

func (f *FakeOrgStore) AddOrgUser(ctx context.Context, cmd *org.AddOrgUserCommand) error {
	return f.ExpectedError
}

func (f *FakeOrgStore) UpdateOrgUser(ctx context.Context, cmd *org.UpdateOrgUserCommand) error {
	return f.ExpectedError
}

func (f *FakeOrgStore) GetOrgUsers(ctx context.Context, query *org.GetOrgUsersQuery) ([]*org.OrgUserDTO, error) {
	return f.ExpectedOrgUsers, f.ExpectedError
}

func (f *FakeOrgStore) GetByID(ctx context.Context, query *org.GetOrgByIdQuery) (*org.Org, error) {
	return f.ExpectedOrg, f.ExpectedError
}

func (f *FakeOrgStore) GetByName(ctx context.Context, query *org.GetOrgByNameQuery) (*org.Org, error) {
	return f.ExpectedOrg, f.ExpectedError
}

func (f *FakeOrgStore) SearchOrgUsers(ctx context.Context, query *org.SearchOrgUsersQuery) (*org.SearchOrgUsersQueryResult, error) {
	return f.ExpectedSearchOrgUsersQueryResult, f.ExpectedError
}

func (f *FakeOrgStore) RemoveOrgUser(ctx context.Context, cmd *org.RemoveOrgUserCommand) error {
	return f.ExpectedError
}
