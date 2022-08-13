package orgimpl

import (
	"context"
	"fmt"
	"time"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
)

type Service struct {
	store store
	cfg   *setting.Cfg
	log   log.Logger
}

func ProvideService(db db.DB, cfg *setting.Cfg) org.Service {
	log := log.New("org service")
	return &Service{
		store: &sqlStore{
			db:      db,
			dialect: db.GetDialect(),
			cfg:     cfg,
			log:     log,
		},
		cfg: cfg,
		log: log,
	}
}

func (s *Service) GetIDForNewUser(ctx context.Context, cmd org.GetOrgIDForNewUserCommand) (int64, error) {
	var orga org.Org
	if cmd.SkipOrgSetup {
		return -1, nil
	}

	if setting.AutoAssignOrg && cmd.OrgID != 0 {
		_, err := s.store.Get(ctx, cmd.OrgID)
		if err != nil {
			return -1, err
		}
		return cmd.OrgID, nil
	}

	orgName := cmd.OrgName
	if len(orgName) == 0 {
		orgName = util.StringsFallback2(cmd.Email, cmd.Login)
	}

	if setting.AutoAssignOrg {
		orga, err := s.store.Get(ctx, int64(s.cfg.AutoAssignOrgId))
		if err != nil {
			return 0, err
		}
		if orga.ID != 0 {
			return orga.ID, nil
		}
		if setting.AutoAssignOrgId != 1 {
			s.log.Error("Could not create user: organization ID does not exist", "orgID",
				setting.AutoAssignOrgId)
			return 0, fmt.Errorf("could not create user: organization ID %d does not exist",
				setting.AutoAssignOrgId)
		}
		orga.Name = MainOrgName
		orga.ID = int64(setting.AutoAssignOrgId)
	} else {
		orga.Name = orgName
	}
	orga.Created = time.Now()
	orga.Updated = time.Now()

	return s.store.Insert(ctx, &orga)
}

func (s *Service) InsertOrgUser(ctx context.Context, orguser *user.OrgUser) (int64, error) {
	return s.store.InsertOrgUser(ctx, orguser)
}

func (s *Service) DeleteUserFromAll(ctx context.Context, userID int64) error {
	return s.store.DeleteUserFromAll(ctx, userID)
}

func (s *Service) CreateOrg(ctx context.Context, cmd *org.CreateOrgCommand) error {
	return s.store.CreateOrg(ctx, cmd)
}

func (s *Service) CreateOrgWithMember(ctx context.Context, name string, userID int64) (org.Org, error) {
	return s.store.CreateOrgWithMember(ctx, name, userID)
}

func (s *Service) UpdateOrg(ctx context.Context, cmd *org.UpdateOrgCommand) error {
	return s.store.UpdateOrg(ctx, cmd)
}

func (s *Service) UpdateOrgAddress(ctx context.Context, cmd *org.UpdateOrgAddressCommand) error {
	return s.store.UpdateOrgAddress(ctx, cmd)
}

func (s *Service) DeleteOrg(ctx context.Context, cmd *org.DeleteOrgCommand) error {
	return s.store.DeleteOrg(ctx, cmd)
}

func (s *Service) GetOrgByNameHandler(ctx context.Context, query *org.GetOrgByNameQuery) error {
	return s.store.GetOrgByNameHandler(ctx, query)
}

func (s *Service) GetOrgById(ctx context.Context, query *org.GetOrgByIdQuery) error {
	return s.store.GetOrgById(ctx, query)
}

func (s *Service) SearchOrgs(ctx context.Context, query *org.SearchOrgsQuery) error {
	return s.store.SearchOrgs(ctx, query)
}

func (s *Service) AddOrgUser(ctx context.Context, cmd *org.AddOrgUserCommand) error {
	return s.store.AddOrgUser(ctx, cmd)
}

func (s *Service) UpdateOrgUser(ctx context.Context, cmd *org.UpdateOrgUserCommand) error {
	return s.store.UpdateOrgUser(ctx, cmd)
}

func (s *Service) SearchOrgUsers(ctx context.Context, query *org.SearchOrgUsersQuery) error {
	return s.store.SearchOrgUsers(ctx, query)
}

func (s *Service) GetOrgUsers(ctx context.Context, query *org.GetOrgUsersQuery) error {
	return s.store.GetOrgUsers(ctx, query)
}

func (s *Service) RemoveOrgUser(ctx context.Context, cmd *org.RemoveOrgUserCommand) error {
	return s.store.RemoveOrgUser(ctx, cmd)
}

func (s *Service) GetUserOrgList(ctx context.Context, query *org.GetUserOrgListQuery) error
func (s *Service) SetUsingOrg(ctx context.Context, cmd *org.SetUsingOrgCommand) error
