package org

import (
	"context"

	"github.com/grafana/grafana/pkg/services/user"
)

type Service interface {
	GetIDForNewUser(context.Context, GetOrgIDForNewUserCommand) (int64, error)
	InsertOrgUser(context.Context, *user.OrgUser) (int64, error)
	DeleteUserFromAll(context.Context, int64) error
	CreateOrg(context.Context, *CreateOrgCommand) (*Org, error)
	CreateOrgWithMember(name string, userID int64) (*Org, error)
	UpdateOrg(ctx context.Context, cmd *UpdateOrgCommand) error
	UpdateOrgAddress(ctx context.Context, cmd UpdateOrgAddressCommand) error
	DeleteOrg(ctx context.Context, cmd DeleteOrgCommand) error
	GetOrgById(context.Context, GetOrgByIdQuery) error
	GetOrgByNameHandler(ctx context.Context, query GetOrgByNameQuery) error
	AddOrgUser(ctx context.Context, cmd AddOrgUserCommand) error
	UpdateOrgUser(ctx context.Context, cmd UpdateOrgUserCommand) error
	GetOrgUsers(ctx context.Context, query GetOrgUsersQuery) error
	SearchOrgUsers(ctx context.Context, query SearchOrgUsersQuery) error
	RemoveOrgUser(ctx context.Context, cmd RemoveOrgUserCommand) error
	SearchOrgs(ctx context.Context, query SearchOrgsQuery) error
	GetUserOrgList(ctx context.Context, query GetUserOrgListQuery) error
	SetUsingOrg(ctx context.Context, cmd SetUsingOrgCommand) error
}
