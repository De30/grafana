package user

import (
	"errors"
	"fmt"
	"strings"
	"time"
)

type HelpFlags1 uint64

func (f HelpFlags1) HasFlag(flag HelpFlags1) bool { return f&flag != 0 }
func (f *HelpFlags1) AddFlag(flag HelpFlags1)     { *f |= flag }

const (
	HelpFlagGettingStartedPanelDismissed HelpFlags1 = 1 << iota
	HelpFlagDashboardHelp1
)

// Typed errors
var (
	ErrCaseInsensitive   = errors.New("case insensitive conflict")
	ErrUserNotFound      = errors.New("user not found")
	ErrUserAlreadyExists = errors.New("user already exists")
	ErrLastGrafanaAdmin  = errors.New("cannot remove last grafana admin")
	ErrProtectedUser     = errors.New("cannot adopt protected user")
)

type User struct {
	ID            int64 `xorm:"pk autoincr 'id'"`
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

	IsAdmin          bool
	IsServiceAccount bool
	OrgID            int64 `xorm:"org_id"`

	Created    time.Time
	Updated    time.Time
	LastSeenAt time.Time
}

type CreateUserCommand struct {
	Email            string
	Login            string
	Name             string
	Company          string
	OrgID            int64
	OrgName          string
	Password         string
	EmailVerified    bool
	IsAdmin          bool
	IsDisabled       bool
	SkipOrgSetup     bool
	DefaultOrgRole   string
	IsServiceAccount bool
}

type GetUserByLoginQuery struct {
	LoginOrEmail string
}

type GetUserByEmailQuery struct {
	Email string
}

type UpdateUserCommand struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Login string `json:"login"`
	Theme string `json:"theme"`

	UserID int64 `json:"-"`
}

type ChangeUserPasswordCommand struct {
	OldPassword string `json:"oldPassword"`
	NewPassword string `json:"newPassword"`

	UserID int64 `json:"-"`
}

type UpdateUserLastSeenAtCommand struct {
	UserID int64
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

type DeleteUserCommand struct {
	UserID int64
}

type GetUserByIDQuery struct {
	ID int64
}

type ErrCaseInsensitiveLoginConflict struct {
	Users []User
}

type SignedInUser struct {
	UserId             int64
	OrgId              int64
	OrgName            string
	OrgRole            RoleType
	ExternalAuthModule string
	ExternalAuthId     string
	Login              string
	Name               string
	Email              string
	ApiKeyId           int64
	OrgCount           int
	IsGrafanaAdmin     bool
	IsAnonymous        bool
	IsDisabled         bool
	HelpFlags1         HelpFlags1
	LastSeenAt         time.Time
	Teams              []int64
	// Permissions grouped by orgID and actions
	Permissions map[int64]map[string][]string `json:"-"`
}

// swagger:enum RoleType
type RoleType string

const (
	RoleViewer RoleType = "Viewer"
	RoleEditor RoleType = "Editor"
	RoleAdmin  RoleType = "Admin"
)

func (r RoleType) IsValid() bool {
	return r == RoleViewer || r == RoleAdmin || r == RoleEditor
}

func (r RoleType) Includes(other RoleType) bool {
	if r == RoleAdmin {
		return true
	}

	if r == RoleEditor {
		return other != RoleAdmin
	}

	return r == other
}

func (r RoleType) Children() []RoleType {
	switch r {
	case RoleAdmin:
		return []RoleType{RoleEditor, RoleViewer}
	case RoleEditor:
		return []RoleType{RoleViewer}
	default:
		return nil
	}
}

func (r RoleType) Parents() []RoleType {
	switch r {
	case RoleEditor:
		return []RoleType{RoleAdmin}
	case RoleViewer:
		return []RoleType{RoleEditor, RoleAdmin}
	default:
		return nil
	}
}

func (r *RoleType) UnmarshalText(data []byte) error {
	// make sure "viewer" and "Viewer" are both correct
	str := strings.Title(string(data))

	*r = RoleType(str)
	if !r.IsValid() {
		if (*r) != "" {
			return fmt.Errorf("invalid role value: %s", *r)
		}

		*r = RoleViewer
	}

	return nil
}

type OrgUser struct {
	ID      int64 `xorm:"pk autoincr 'id'"`
	OrgID   int64 `xorm:"org_id"`
	UserID  int64 `xorm:"user_id"`
	Role    RoleType
	Created time.Time
	Updated time.Time
}

type UserDisplayDTO struct {
	Id        int64  `json:"id,omitempty"`
	Name      string `json:"name,omitempty"`
	Login     string `json:"login,omitempty"`
	AvatarUrl string `json:"avatarUrl"`
}

// ------------------------
// DTO & Projections

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

func (u *SignedInUser) ToUserDisplayDTO() *UserDisplayDTO {
	return &UserDisplayDTO{
		Id:    u.UserId,
		Login: u.Login,
		Name:  u.Name,
	}
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

func (e *ErrCaseInsensitiveLoginConflict) Unwrap() error {
	return ErrCaseInsensitive
}

func (e *ErrCaseInsensitiveLoginConflict) Error() string {
	n := len(e.Users)

	userStrings := make([]string, 0, n)
	for _, v := range e.Users {
		userStrings = append(userStrings, fmt.Sprintf("%s (email:%s, id:%d)", v.Login, v.Email, v.ID))
	}

	return fmt.Sprintf(
		"Found a conflict in user login information. %d users already exist with either the same login or email: [%s].",
		n, strings.Join(userStrings, ", "))
}
