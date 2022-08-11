package org

import (
	"errors"
	"time"

	"github.com/grafana/grafana/pkg/services/user"
)

// Typed errors
var (
	ErrOrgNotFound  = errors.New("organization not found")
	ErrOrgNameTaken = errors.New("organization name is taken")
)

type Org struct {
	ID      int64 `xorm:"pk autoincr 'id'"`
	Version int
	Name    string

	Address1 string
	Address2 string
	City     string
	ZipCode  string
	State    string
	Country  string

	Created time.Time
	Updated time.Time
}

type CreateOrgCommand struct {
	Name string `json:"name" binding:"Required"`

	// initial admin user for account
	UserID int64 `json:"-"`

	Result Org `json:"-"`
}

type GetOrgIDForNewUserCommand struct {
	Email        string
	Login        string
	OrgID        int64
	OrgName      string
	SkipOrgSetup bool
}

type UpdateOrgCommand struct {
	Name  string
	OrgId int64
}

type UpdateOrgAddressCommand struct {
	OrgId int64
	Address
}

type DeleteOrgCommand struct {
	Id int64
}

type Address struct {
	Address1 string `json:"address1"`
	Address2 string `json:"address2"`
	City     string `json:"city"`
	ZipCode  string `json:"zipCode"`
	State    string `json:"state"`
	Country  string `json:"country"`
}

type GetOrgByIdQuery struct {
	Id     int64
	Result *Org
}

type GetOrgByNameQuery struct {
	Name   string
	Result *Org
}

type SearchOrgsQuery struct {
	Query string
	Name  string
	Limit int
	Page  int
	Ids   []int64

	Result []*OrgDTO
}

type UserOrgDTO struct {
	OrgId int64         `json:"orgId"`
	Name  string        `json:"name"`
	Role  user.RoleType `json:"role"`
}

type OrgDTO struct {
	Id   int64  `json:"id"`
	Name string `json:"name"`
}

type AddOrgUserCommand struct {
	LoginOrEmail string        `json:"loginOrEmail" binding:"Required"`
	Role         user.RoleType `json:"role" binding:"Required"`

	OrgId  int64 `json:"-"`
	UserId int64 `json:"-"`

	// internal use: avoid adding service accounts to orgs via user routes
	AllowAddingServiceAccount bool `json:"-"`
}

type UpdateOrgUserCommand struct {
	Role user.RoleType `json:"role" binding:"Required"`

	OrgId  int64 `json:"-"`
	UserId int64 `json:"-"`
}

type GetOrgUsersQuery struct {
	UserID int64
	OrgId  int64
	Query  string
	Limit  int
	// Flag used to allow oss edition to query users without access control
	DontEnforceAccessControl bool

	User   *user.SignedInUser
	Result []*OrgUserDTO
}

type SearchOrgUsersQuery struct {
	OrgID int64
	Query string
	Page  int
	Limit int

	User   *user.SignedInUser
	Result SearchOrgUsersQueryResult
}

type SearchOrgUsersQueryResult struct {
	TotalCount int64         `json:"totalCount"`
	OrgUsers   []*OrgUserDTO `json:"OrgUsers"`
	Page       int           `json:"page"`
	PerPage    int           `json:"perPage"`
}

type OrgUserDTO struct {
	OrgId         int64           `json:"orgId"`
	UserId        int64           `json:"userId"`
	Email         string          `json:"email"`
	Name          string          `json:"name"`
	AvatarUrl     string          `json:"avatarUrl"`
	Login         string          `json:"login"`
	Role          string          `json:"role"`
	LastSeenAt    time.Time       `json:"lastSeenAt"`
	Updated       time.Time       `json:"-"`
	Created       time.Time       `json:"-"`
	LastSeenAtAge string          `json:"lastSeenAtAge"`
	AccessControl map[string]bool `json:"accessControl,omitempty"`
}

type RemoveOrgUserCommand struct {
	UserId                   int64
	OrgId                    int64
	ShouldDeleteOrphanedUser bool
	UserWasDeleted           bool
}

type GetUserOrgListQuery struct {
	UserId int64
	Result []*UserOrgDTO
}

type SetUsingOrgCommand struct {
	UserId int64
	OrgId  int64
}
