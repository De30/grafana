package manager

import (
	"context"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/teamguardian"
	"github.com/grafana/grafana/pkg/services/user"
)

type Service struct {
	store teamguardian.Store
}

func ProvideService(store teamguardian.Store) teamguardian.TeamGuardian {
	return &Service{store: store}
}

func (s *Service) CanAdmin(ctx context.Context, orgId int64, teamId int64, u *user.SignedInUser) error {
	if u.OrgRole == user.RoleAdmin {
		return nil
	}

	if u.OrgId != orgId {
		return models.ErrNotAllowedToUpdateTeamInDifferentOrg
	}

	cmd := models.GetTeamMembersQuery{
		OrgId:        orgId,
		TeamId:       teamId,
		UserId:       u.UserId,
		SignedInUser: u,
	}

	results, err := s.store.GetTeamMembers(ctx, cmd)
	if err != nil {
		return err
	}

	for _, member := range results {
		if member.UserId == u.UserId && member.Permission == models.PERMISSION_ADMIN {
			return nil
		}
	}

	return models.ErrNotAllowedToUpdateTeam
}

func (s *Service) DeleteByUser(ctx context.Context, userID int64) error {
	return s.store.DeleteByUser(ctx, userID)
}
