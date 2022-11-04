package orgimpl

import (
	"context"
	"fmt"
	"time"

	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/org"
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
			log:     log,
			cfg:     cfg,
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

func (s *Service) InsertOrgUser(ctx context.Context, orguser *org.OrgUser) (int64, error) {
	return s.store.InsertOrgUser(ctx, orguser)
}

func (s *Service) DeleteUserFromAll(ctx context.Context, userID int64) error {
	return s.store.DeleteUserFromAll(ctx, userID)
}

// TODO: refactor service to call store CRUD method
func (s *Service) GetUserOrgList(ctx context.Context, query *org.GetUserOrgListQuery) ([]*org.UserOrgDTO, error) {
	return s.store.GetUserOrgList(ctx, query)
}

// TODO: refactor service to call store CRUD method
func (s *Service) UpdateOrg(ctx context.Context, cmd *org.UpdateOrgCommand) error {
	return s.store.Update(ctx, cmd)
}

// TODO: refactor service to call store CRUD method
func (s *Service) Search(ctx context.Context, query *org.SearchOrgsQuery) ([]*org.OrgDTO, error) {
	return s.store.Search(ctx, query)
}

func (s *Service) GetByID(ctx context.Context, query *org.GetOrgByIdQuery) (*org.Org, error) {
	return s.store.GetByID(ctx, query)
}

func (s *Service) GetByName(ctx context.Context, query *org.GetOrgByNameQuery) (*org.Org, error) {
	return s.store.GetByName(ctx, query)
}

// TODO: refactor service to call store CRUD method
func (s *Service) CreateWithMember(ctx context.Context, cmd *org.CreateOrgCommand) (*org.Org, error) {
	return s.store.CreateWithMember(ctx, cmd)
}

// TODO: refactor service to call store CRUD method
func (s *Service) UpdateAddress(ctx context.Context, cmd *org.UpdateOrgAddressCommand) error {
	return s.store.UpdateAddress(ctx, cmd)
}

// TODO: refactor service to call store CRUD method
func (s *Service) Delete(ctx context.Context, cmd *org.DeleteOrgCommand) error {
	return s.store.Delete(ctx, cmd)
}

func (s *Service) GetOrCreate(ctx context.Context, orgName string) (int64, error) {
	var orga *org.Org
	var err error
	if s.cfg.AutoAssignOrg {
		orga, err = s.store.Get(ctx, int64(s.cfg.AutoAssignOrgId))
		if err != nil {
			return 0, err
		}

		if s.cfg.AutoAssignOrgId != 1 {
			s.log.Error("Could not create user: organization ID does not exist", "orgID",
				s.cfg.AutoAssignOrgId)
			return 0, fmt.Errorf("could not create user: organization ID %d does not exist",
				s.cfg.AutoAssignOrgId)
		}

		orga.Name = MainOrgName
		orga.ID = int64(s.cfg.AutoAssignOrgId)
	} else {
		orga = &org.Org{}
		orga.Name = orgName
	}

	orga.Created = time.Now()
	orga.Updated = time.Now()

	_, err = s.store.Insert(ctx, orga)
	if err != nil {
		return 0, err
	}
	return orga.ID, nil
}

// TODO: refactor service to call store CRUD method
func (s *Service) AddOrgUser(ctx context.Context, cmd *org.AddOrgUserCommand) error {
	return s.store.AddOrgUser(ctx, cmd)
}

// TODO: refactor service to call store CRUD method
func (s *Service) UpdateOrgUser(ctx context.Context, cmd *org.UpdateOrgUserCommand) error {
	return s.store.UpdateOrgUser(ctx, cmd)
}

// TODO: refactor service to call store CRUD method
func (s *Service) RemoveOrgUser(ctx context.Context, cmd *org.RemoveOrgUserCommand) error {
	return s.store.RemoveOrgUser(ctx, cmd)
}

// TODO: refactor service to call store CRUD method
func (s *Service) GetOrgUsers(ctx context.Context, query *org.GetOrgUsersQuery) ([]*org.OrgUserDTO, error) {
	return s.store.GetOrgUsers(ctx, query)
}

// TODO: refactor service to call store CRUD method
func (s *Service) SearchOrgUsers(ctx context.Context, query *org.SearchOrgUsersQuery) (*org.SearchOrgUsersQueryResult, error) {
	return s.store.SearchOrgUsers(ctx, query)
}
