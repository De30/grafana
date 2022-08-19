package commentmodel

import (
	"database/sql"
	"database/sql/driver"
	"encoding/json"
	"fmt"
)

const (
	// ObjectTypeOrg is reserved for future use for per-org comments.
	ObjectTypeOrg = "org"
	// ObjectTypeDashboard used for dashboard-wide comments.
	ObjectTypeDashboard = "dashboard"
	// ObjectTypeAnnotation used for annotation comments.
	ObjectTypeAnnotation = "annotation"
)

var RegisteredObjectTypes = map[string]struct{}{
	ObjectTypeOrg:        {},
	ObjectTypeDashboard:  {},
	ObjectTypeAnnotation: {},
}

type CommentGroup struct {
	Id         int64
	OrgId      int64
	ObjectType string
	ObjectId   string
	Settings   Settings

	Created int64
	Updated int64
}

func (i CommentGroup) TableName() string {
	return "comment_group"
}

type Settings struct {
}

var (
	_ driver.Valuer = Settings{}
	_ sql.Scanner   = &Settings{}
)

func (s Settings) Value() (driver.Value, error) {
	d, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}
	return string(d), nil
}

func (s *Settings) Scan(value interface{}) error {
	switch v := value.(type) {
	case string:
		return json.Unmarshal([]byte(v), s)
	case []uint8:
		return json.Unmarshal(v, s)
	default:
		return fmt.Errorf("type assertion on scan failed: got %T", value)
	}
}

type Comment struct {
	Id       int64
	GroupId  int64
	UserId   int64
	ParentId int64
	ChildId  int64
	Rating   int64
	Content  string

	Created int64
	Updated int64
}

type Update struct {
	Id     int64
	Rating int64

	Updated int64
}

type CommentUser struct {
	Id        int64  `json:"id"`
	Name      string `json:"name"`
	Login     string `json:"login"`
	Email     string `json:"email"`
	AvatarUrl string `json:"avatarUrl"`
}

type CommentDto struct {
	Id       int64        `json:"id"`
	UserId   int64        `json:"userId"`
	ParentId int64        `json:"parentId,omitempty"`
	ChildId  int64        `json:"childId,omitempty"`
	Content  string       `json:"content"`
	Created  int64        `json:"created"`
	Rating   int64        `json:"rating"`
	User     *CommentUser `json:"user,omitempty"`
}

type CommentUpdate struct {
	Id     int64 `json:"id"`
	UserId int64 `json:"userId"`
	Rating int64 `json:"rating"`
}

func (i Comment) ToDTO(user *CommentUser) *CommentDto {
	return &CommentDto{
		Id:      i.Id,
		UserId:  i.UserId,
		Content: i.Content,
		Created: i.Created,
		Rating:  i.Rating,
		User:    user,
	}
}

func (i Comment) TableName() string {
	return "comment"
}

func (i Update) TableName() string {
	return "comment"
}

func (i Update) ToUpdate() *CommentUpdate {
	return &CommentUpdate{
		Id:     i.Id,
		Rating: i.Rating,
	}
}
