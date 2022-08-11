package dtos

import (
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/user"
)

// swagger:model
type UpdateDashboardACLCommand struct {
	Items []DashboardACLUpdateItem `json:"items"`
}

// swagger:model
type DashboardACLUpdateItem struct {
	UserID int64          `json:"userId"`
	TeamID int64          `json:"teamId"`
	Role   *user.RoleType `json:"role,omitempty"`
	// Permission level
	// Description:
	// * `1` - View
	// * `2` - Edit
	// * `4` - Admin
	// Enum: 1,2,4
	Permission models.PermissionType `json:"permission"`
}
