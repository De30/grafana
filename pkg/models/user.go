package models

import (
	"errors"
	"time"
)

// Typed errors
var (
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrLastGrafanaAdmin  = errors.New("cannot remove last grafana admin")
)

type Password string

func (p Password) IsWeak() bool {
	return len(p) <= 4
}

type User struct {
	Id            int64
	Version       int
	Email         string
	Name          string
	Login         string
	Password      string
	Salt          string
	Rands         string
	Company       string
	EmailVerified bool
	Theme         string
	HelpFlags1    HelpFlags1
	IsDisabled    bool

	IsAdmin bool
	OrgId   int64

	Created    time.Time
	Updated    time.Time
	LastSeenAt time.Time
}

func (u *User) NameOrFallback() string {
	if u.Name != "" {
		return u.Name
	}
	if u.Login != "" {
		return u.Login
	}
	return u.Email
}

// ---------------------
// COMMANDS

type CreateUserCommand struct {
	Email          string
	Login          string
	Name           string
	Company        string
	OrgId          int64
	OrgName        string
	Password       string
	EmailVerified  bool
	IsAdmin        bool
	IsDisabled     bool
	SkipOrgSetup   bool
	DefaultOrgRole string

	Result User
}

// swagger:parameters updateUserSelf
type UpdateUserCommand struct {
	// Name of user
	//
	// in: body
	Name string `json:"name"`
	// Email address of user
	//
	// in: body
	Email string `json:"email"`
	// Login name of user
	//
	// in: body
	Login string `json:"login"`
	// Theme user is using
	//
	// in: body
	Theme string `json:"theme"`

	UserId int64 `json:"-"`
}

type ChangeUserPasswordCommand struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`

	UserId int64 `json:"-"`
}

type UpdateUserPermissionsCommand struct {
	IsGrafanaAdmin bool
	UserId         int64 `json:"-"`
}

type DisableUserCommand struct {
	UserId     int64
	IsDisabled bool
}

type BatchDisableUsersCommand struct {
	UserIds    []int64
	IsDisabled bool
}

type DeleteUserCommand struct {
	UserId int64
}

type SetUsingOrgCommand struct {
	UserId int64
	OrgId  int64
}

// ----------------------
// QUERIES

type GetUserByLoginQuery struct {
	LoginOrEmail string
	Result       *User
}

type GetUserByEmailQuery struct {
	Email  string
	Result *User
}

type GetUserByIdQuery struct {
	Id     int64
	Result *User
}

type GetSignedInUserQuery struct {
	UserId int64
	Login  string
	Email  string
	OrgId  int64
	Result *SignedInUser
}

type GetUserProfileQuery struct {
	UserId int64
	Result UserProfileDTO
}

type SearchUsersQuery struct {
	OrgId      int64
	Query      string
	Page       int
	Limit      int
	AuthModule string

	IsDisabled *bool

	Result SearchUserQueryResult
}

type SearchUserQueryResult struct {
	TotalCount int64               `json:"totalCount"`
	Users      []*UserSearchHitDTO `json:"users"`
	Page       int                 `json:"page"`
	PerPage    int                 `json:"perPage"`
}

type GetUserOrgListQuery struct {
	UserId int64
	Result []*UserOrgDTO
}

// ------------------------
// DTO & Projections

type SignedInUser struct {
	UserId         int64
	OrgId          int64
	OrgName        string
	OrgRole        RoleType
	Login          string
	Name           string
	Email          string
	ApiKeyId       int64
	OrgCount       int
	IsGrafanaAdmin bool
	IsAnonymous    bool
	HelpFlags1     HelpFlags1
	LastSeenAt     time.Time
	Teams          []int64
}

func (u *SignedInUser) ShouldUpdateLastSeenAt() bool {
	return u.UserId > 0 && time.Since(u.LastSeenAt) > time.Minute*5
}

func (u *SignedInUser) NameOrFallback() string {
	if u.Name != "" {
		return u.Name
	}
	if u.Login != "" {
		return u.Login
	}
	return u.Email
}

type UpdateUserLastSeenAtCommand struct {
	UserId int64
}

func (u *SignedInUser) HasRole(role RoleType) bool {
	if u.IsGrafanaAdmin {
		return true
	}

	return u.OrgRole.Includes(role)
}

func (u *SignedInUser) IsRealUser() bool {
	return u.UserId != 0
}

// UserProfile represents the user for this application
//
// swagger:model userProfile
// The user profile
type UserProfileDTO struct {
	// the id for this user
	Id int64 `json:"id"`

	// the email address of this user
	Email string `json:"email"`

	// the name of this user
	Name string `json:"name"`

	// the login name of this user
	Login string `json:"login"`

	// the theme this user is currently using
	Theme string `json:"theme"`

	// the orgId of this user
	OrgId int64 `json:"orgId"`

	// the flag for whether this user is a GrafanaAdmin
	IsGrafanaAdmin bool `json:"isGrafanaAdmin"`

	// the flag for whether this user is currently disabled
	IsDisabled bool `json:"isDisabled"`

	// the flag for whether this user uses an external auth module
	IsExternal bool `json:"isExternal"`

	// the authLabels for this user
	AuthLabels []string `json:"authLabels"`

	// the timestamp this user profile was last updated
	UpdatedAt time.Time `json:"updatedAt"`

	// the timestmap this user profile was created
	CreatedAt time.Time `json:"createdAt"`

	// the url for this users avatar
	AvatarUrl string `json:"avatarUrl"`
}

type UserSearchHitDTO struct {
	Id            int64                `json:"id"`
	Name          string               `json:"name"`
	Login         string               `json:"login"`
	Email         string               `json:"email"`
	AvatarUrl     string               `json:"avatarUrl"`
	IsAdmin       bool                 `json:"isAdmin"`
	IsDisabled    bool                 `json:"isDisabled"`
	LastSeenAt    time.Time            `json:"lastSeenAt"`
	LastSeenAtAge string               `json:"lastSeenAtAge"`
	AuthLabels    []string             `json:"authLabels"`
	AuthModule    AuthModuleConversion `json:"-"`
}

type UserIdDTO struct {
	Id      int64  `json:"id"`
	Message string `json:"message"`
}

// implement Conversion interface to define custom field mapping (xorm feature)
type AuthModuleConversion []string

func (auth *AuthModuleConversion) FromDB(data []byte) error {
	auth_module := string(data)
	*auth = []string{auth_module}
	return nil
}

// Just a stub, we don't want to write to database
func (auth *AuthModuleConversion) ToDB() ([]byte, error) {
	return []byte{}, nil
}
