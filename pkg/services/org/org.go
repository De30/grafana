package org

import (
	"context"

	"github.com/grafana/grafana/pkg/services/user"
)

type Service interface {
	GetIDForNewUser(context.Context, GetOrgIDForNewUserCommand) (int64, error)
	InsertOrgUser(context.Context, *user.OrgUser) (int64, error)
	DeleteUserFromAll(context.Context, int64) error
	CreateOrg(context.Context, *CreateOrgCommand) error
	CreateOrgWithMember(ctx context.Context, name string, userID int64) (*Org, error)
	UpdateOrg(context.Context, *UpdateOrgCommand) error
	UpdateOrgAddress(context.Context, *UpdateOrgAddressCommand) error
	DeleteOrg(context.Context, *DeleteOrgCommand) error
	GetOrgById(context.Context, *GetOrgByIdQuery) error
	GetOrgByNameHandler(context.Context, GetOrgByNameQuery) error
	AddOrgUser(context.Context, *AddOrgUserCommand) error
	UpdateOrgUser(context.Context, *UpdateOrgUserCommand) error
	GetOrgUsers(context.Context, *GetOrgUsersQuery) error
	SearchOrgUsers(context.Context, *SearchOrgUsersQuery) error
	RemoveOrgUser(context.Context, *RemoveOrgUserCommand) error
	SearchOrgs(context.Context, *SearchOrgsQuery) error
	GetUserOrgList(context.Context, *GetUserOrgListQuery) error
	SetUsingOrg(context.Context, *SetUsingOrgCommand) error
}
