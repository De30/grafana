package usersync

import (
	"context"
	"errors"
	"fmt"
	"sort"

	"github.com/grafana/grafana/pkg/cmd/grafana-cli/logger"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/authn"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/user"
)

func ProvideOrgSync(userService user.Service, orgService org.Service, accessControl accesscontrol.Service) *OrgSync {
	return &OrgSync{userService, orgService, accessControl, log.New("org.sync")}
}

type OrgSync struct {
	userService   user.Service
	orgService    org.Service
	accessControl accesscontrol.Service

	log log.Logger
}

func (s *OrgSync) SyncOrgUser(ctx context.Context, clientParams *authn.ClientParams, id *authn.Identity) error {
	if !clientParams.SyncUser {
		s.log.Debug("Not syncing org user", "auth_module", id.AuthModule, "auth_id", id.AuthID)
		return nil
	}

	namespace, userID := id.NamespacedID()
	if namespace != "user" && userID <= 0 {
		return fmt.Errorf("invalid namespace %q for user ID %q", namespace, userID)
	}

	s.log.Debug("Syncing organization roles", "id", userID, "extOrgRoles", id.OrgRoles)
	// don't sync org roles if none is specified
	if len(id.OrgRoles) == 0 {
		s.log.Debug("Not syncing organization roles since external user doesn't have any")
		return nil
	}

	orgsQuery := &org.GetUserOrgListQuery{UserID: userID}
	result, err := s.orgService.GetUserOrgList(ctx, orgsQuery)
	if err != nil {
		return err
	}

	handledOrgIds := map[int64]bool{}
	deleteOrgIds := []int64{}

	// update existing org roles
	for _, orga := range result {
		handledOrgIds[orga.OrgID] = true

		extRole := id.OrgRoles[orga.OrgID]
		if extRole == "" {
			deleteOrgIds = append(deleteOrgIds, orga.OrgID)
		} else if extRole != orga.Role {
			// update role
			cmd := &org.UpdateOrgUserCommand{OrgID: orga.OrgID, UserID: userID, Role: extRole}
			if err := s.orgService.UpdateOrgUser(ctx, cmd); err != nil {
				return err
			}
		}
	}

	orgIDs := make([]int64, 0, len(id.OrgRoles))
	// add any new org roles
	for orgId, orgRole := range id.OrgRoles {
		orgIDs = append(orgIDs, orgId)
		if _, exists := handledOrgIds[orgId]; exists {
			continue
		}

		// add role
		cmd := &org.AddOrgUserCommand{UserID: userID, Role: orgRole, OrgID: orgId}
		err := s.orgService.AddOrgUser(ctx, cmd)
		if err != nil && !errors.Is(err, models.ErrOrgNotFound) {
			return err
		}
	}

	// delete any removed org roles
	for _, orgId := range deleteOrgIds {
		s.log.Debug("Removing user's organization membership as part of syncing with OAuth login",
			"userId", userID, "orgId", orgId)
		cmd := &org.RemoveOrgUserCommand{OrgID: orgId, UserID: userID}
		if err := s.orgService.RemoveOrgUser(ctx, cmd); err != nil {
			if errors.Is(err, models.ErrLastOrgAdmin) {
				logger.Error(err.Error(), "userId", cmd.UserID, "orgId", cmd.OrgID)
				continue
			}

			return err
		}

		if err := s.accessControl.DeleteUserPermissions(ctx, orgId, cmd.UserID); err != nil {
			logger.Error("failed to delete permissions for user", "error", err, "userID", cmd.UserID, "orgID", orgId)
			return err
		}
	}

	// Note: sort all org ids to not make it flaky, for now we default to the lowest id
	sort.Slice(orgIDs, func(i, j int) bool { return orgIDs[i] < orgIDs[j] })
	// update user's default org if needed
	if _, ok := id.OrgRoles[id.OrgID]; !ok {
		if len(orgIDs) > 0 {
			id.OrgID = orgIDs[0]
			return s.userService.SetUsingOrg(ctx, &user.SetUsingOrgCommand{
				UserID: userID,
				OrgID:  id.OrgID,
			})
		}
	}

	return nil
}
