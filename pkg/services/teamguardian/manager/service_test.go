package manager

import (
	"context"
	"testing"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/org"
	"github.com/grafana/grafana/pkg/services/team"
	"github.com/grafana/grafana/pkg/services/teamguardian/database"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

func TestUpdateTeam(t *testing.T) {
	store := new(database.TeamGuardianStoreMock)
	teamGuardianService := ProvideService(store)

	t.Run("Updating a team", func(t *testing.T) {
		admin := user.SignedInUser{
			UserID:  1,
			OrgID:   1,
			OrgRole: org.RoleAdmin,
		}
		editor := user.SignedInUser{
			UserID:  2,
			OrgID:   1,
			OrgRole: org.RoleEditor,
		}
		testTeam := team.Team{
			ID:    1,
			OrgID: 1,
		}

		t.Run("Given an editor and a team he isn't a member of", func(t *testing.T) {
			t.Run("Should not be able to update the team", func(t *testing.T) {
				ctx := context.Background()
				store.On("GetTeamMembers", ctx, mock.Anything).Return([]*models.TeamMemberDTO{}, nil).Once()
				err := teamGuardianService.CanAdmin(ctx, testTeam.OrgID, testTeam.ID, &editor)
				require.Equal(t, team.ErrNotAllowedToUpdateTeam, err)
			})
		})

		t.Run("Given an editor and a team he is an admin in", func(t *testing.T) {
			t.Run("Should be able to update the team", func(t *testing.T) {
				ctx := context.Background()

				result := []*models.TeamMemberDTO{{
					OrgId:      testTeam.OrgID,
					TeamId:     testTeam.ID,
					UserId:     editor.UserID,
					Permission: models.PERMISSION_ADMIN,
				}}

				store.On("GetTeamMembers", ctx, mock.Anything).Return(result, nil).Once()
				err := teamGuardianService.CanAdmin(ctx, testTeam.OrgID, testTeam.ID, &editor)
				require.NoError(t, err)
			})
		})

		t.Run("Given an editor and a team in another org", func(t *testing.T) {
			ctx := context.Background()

			testTeamOtherOrg := team.Team{
				ID:    1,
				OrgID: 2,
			}

			t.Run("Shouldn't be able to update the team", func(t *testing.T) {
				result := []*models.TeamMemberDTO{{
					OrgId:      testTeamOtherOrg.OrgID,
					TeamId:     testTeamOtherOrg.ID,
					UserId:     editor.UserID,
					Permission: models.PERMISSION_ADMIN,
				}}

				store.On("GetTeamMembers", ctx, mock.Anything).Return(result, nil).Once()
				err := teamGuardianService.CanAdmin(ctx, testTeamOtherOrg.OrgID, testTeamOtherOrg.ID, &editor)
				require.Equal(t, team.ErrNotAllowedToUpdateTeamInDifferentOrg, err)
			})
		})

		t.Run("Given an org admin and a team", func(t *testing.T) {
			t.Run("Should be able to update the team", func(t *testing.T) {
				err := teamGuardianService.CanAdmin(context.Background(), testTeam.OrgID, testTeam.ID, &admin)
				require.NoError(t, err)
			})
		})
	})
}
