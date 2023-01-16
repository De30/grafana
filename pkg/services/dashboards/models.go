package dashboards

import (
	"fmt"
	"time"

	"github.com/grafana/grafana/pkg/components/simplejson"
	"github.com/grafana/grafana/pkg/infra/slugify"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/folder"
	"github.com/grafana/grafana/pkg/services/quota"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/setting"
)

const RootFolderName = "General"

const (
	DashTypeDB       = "db"
	DashTypeSnapshot = "snapshot"
)

// Dashboard model
type Dashboard struct {
	ID       int64  `xorm:"pk autoincr 'id'"`
	UID      string `xorm:"uid"`
	Slug     string
	OrgID    int64 `xorm:"org_id"`
	GnetID   int64 `xorm:"gnet_id"`
	Version  int
	PluginID string `xorm:"plugin_id"`

	Created time.Time
	Updated time.Time

	UpdatedBy int64
	CreatedBy int64
	FolderID  int64 `xorm:"folder_id"`
	IsFolder  bool
	HasACL    bool `xorm:"has_acl"`

	Title string
	Data  *simplejson.Json
}

func (d *Dashboard) SetID(id int64) {
	d.ID = id
	d.Data.Set("id", id)
}

func (d *Dashboard) SetUID(uid string) {
	d.UID = uid
	d.Data.Set("uid", uid)
}

func (d *Dashboard) SetVersion(version int) {
	d.Version = version
	d.Data.Set("version", version)
}

// NewDashboard creates a new dashboard
func NewDashboard(title string) *Dashboard {
	dash := &Dashboard{}
	dash.Data = simplejson.New()
	dash.Data.Set("title", title)
	dash.Title = title
	dash.Created = time.Now()
	dash.Updated = time.Now()
	dash.UpdateSlug()
	return dash
}

// NewDashboardFolder creates a new dashboard folder
func NewDashboardFolder(title string) *Dashboard {
	folder := NewDashboard(title)
	folder.IsFolder = true
	folder.Data.Set("schemaVersion", 17)
	folder.Data.Set("version", 0)
	folder.IsFolder = true
	return folder
}

// GetTags turns the tags in data json into go string array
func (d *Dashboard) GetTags() []string {
	return d.Data.Get("tags").MustStringArray()
}

func NewDashboardFromJson(data *simplejson.Json) *Dashboard {
	dash := &Dashboard{}
	dash.Data = data
	dash.Title = dash.Data.Get("title").MustString()
	dash.UpdateSlug()
	update := false

	if id, err := dash.Data.Get("id").Float64(); err == nil {
		dash.ID = int64(id)
		update = true
	}

	if uid, err := dash.Data.Get("uid").String(); err == nil {
		dash.UID = uid
		update = true
	}

	if version, err := dash.Data.Get("version").Float64(); err == nil && update {
		dash.Version = int(version)
		dash.Updated = time.Now()
	} else {
		dash.Data.Set("version", 0)
		dash.Created = time.Now()
		dash.Updated = time.Now()
	}

	if gnetId, err := dash.Data.Get("gnetId").Float64(); err == nil {
		dash.GnetID = int64(gnetId)
	}

	return dash
}

// GetDashboardModel turns the command into the saveable model
func (cmd *SaveDashboardCommand) GetDashboardModel() *Dashboard {
	dash := NewDashboardFromJson(cmd.Dashboard)
	userID := cmd.UserID

	if userID == 0 {
		userID = -1
	}

	dash.UpdatedBy = userID
	dash.OrgID = cmd.OrgID
	dash.PluginID = cmd.PluginID
	dash.IsFolder = cmd.IsFolder
	dash.FolderID = cmd.FolderID
	dash.UpdateSlug()
	return dash
}

// UpdateSlug updates the slug
func (d *Dashboard) UpdateSlug() {
	title := d.Data.Get("title").MustString()
	d.Slug = slugify.Slugify(title)
}

// GetURL return the html url for a folder if it's folder, otherwise for a dashboard
func (d *Dashboard) GetURL() string {
	return GetDashboardFolderURL(d.IsFolder, d.UID, d.Slug)
}

// GetDashboardFolderURL return the html url for a folder if it's folder, otherwise for a dashboard
func GetDashboardFolderURL(isFolder bool, uid string, slug string) string {
	if isFolder {
		return GetFolderURL(uid, slug)
	}

	return GetDashboardURL(uid, slug)
}

// GetDashboardURL returns the HTML url for a dashboard.
func GetDashboardURL(uid string, slug string) string {
	return fmt.Sprintf("%s/d/%s/%s", setting.AppSubUrl, uid, slug)
}

// GetKioskModeDashboardUrl returns the HTML url for a dashboard in kiosk mode.
func GetKioskModeDashboardURL(uid string, slug string, theme models.Theme) string {
	return fmt.Sprintf("%s?kiosk&theme=%s", GetDashboardURL(uid, slug), string(theme))
}

// GetFullDashboardURL returns the full URL for a dashboard.
func GetFullDashboardURL(uid string, slug string) string {
	return fmt.Sprintf("%sd/%s/%s", setting.AppUrl, uid, slug)
}

// GetFolderURL returns the HTML url for a folder.
func GetFolderURL(folderUID string, slug string) string {
	return fmt.Sprintf("%s/dashboards/f/%s/%s", setting.AppSubUrl, folderUID, slug)
}

type ValidateDashboardBeforeSaveResult struct {
	IsParentFolderChanged bool
}

//
// COMMANDS
//

type SaveDashboardCommand struct {
	Dashboard    *simplejson.Json `json:"dashboard" binding:"Required"`
	UserID       int64            `json:"userId" xorm:"user_id"`
	Overwrite    bool             `json:"overwrite"`
	Message      string           `json:"message"`
	OrgID        int64            `json:"-" xorm:"org_id"`
	RestoredFrom int              `json:"-"`
	PluginID     string           `json:"-" xorm:"plugin_id"`
	FolderID     int64            `json:"folderId" xorm:"folder_id"`
	FolderUID    string           `json:"folderUid" xorm:"folder_uid"`
	IsFolder     bool             `json:"isFolder"`

	UpdatedAt time.Time

	Result *Dashboard `json:"-"`
}

type ValidateDashboardCommand struct {
	Dashboard string `json:"dashboard" binding:"Required"`
}

type TrimDashboardCommand struct {
	Dashboard *simplejson.Json `json:"dashboard" binding:"Required"`
	Meta      *simplejson.Json `json:"meta"`
	Result    *Dashboard       `json:"-"`
}

type DashboardProvisioning struct {
	ID          int64 `xorm:"pk autoincr 'id'"`
	DashboardID int64 `xorm:"dashboard_id"`
	Name        string
	ExternalID  string `xorm:"external_id"`
	CheckSum    string
	Updated     int64
}

type DeleteDashboardCommand struct {
	ID                     int64
	OrgID                  int64
	ForceDeleteFolderRules bool
}

type DeleteOrphanedProvisionedDashboardsCommand struct {
	ReaderNames []string
}

//
// QUERIES
//

type GetDashboardQuery struct {
	Slug  string // required if no ID or Uid is specified
	ID    int64  // optional if slug is set
	UID   string // optional if slug is set
	OrgID int64

	Result *Dashboard
}

type DashboardTagCloudItem struct {
	Term  string `json:"term"`
	Count int    `json:"count"`
}

type GetDashboardTagsQuery struct {
	OrgID  int64
	Result []*DashboardTagCloudItem
}

type GetDashboardsQuery struct {
	DashboardIDs  []int64
	DashboardUIDs []string
	Result        []*Dashboard
}

type GetDashboardsByPluginIDQuery struct {
	OrgID    int64
	PluginID string
	Result   []*Dashboard
}

type GetDashboardSlugByIdQuery struct {
	ID     int64
	Result string
}

type GetDashboardsBySlugQuery struct {
	OrgID int64
	Slug  string

	Result []*Dashboard
}

type DashboardRef struct {
	UID  string `xorm:"uid"`
	Slug string
}

type GetDashboardRefByIDQuery struct {
	ID     int64
	Result *DashboardRef
}

type SaveDashboardDTO struct {
	OrgID     int64
	UpdatedAt time.Time
	User      *user.SignedInUser
	Message   string
	Overwrite bool
	Dashboard *Dashboard
}

type DashboardSearchProjection struct {
	ID          int64  `xorm:"id"`
	UID         string `xorm:"uid"`
	Title       string
	Slug        string
	Term        string
	IsFolder    bool
	FolderID    int64  `xorm:"folder_id"`
	FolderUID   string `xorm:"folder_uid"`
	FolderSlug  string
	FolderTitle string
	SortMeta    int64
}

const (
	QuotaTargetSrv quota.TargetSrv = "dashboard"
	QuotaTarget    quota.Target    = "dashboard"
)

type CountDashboardsInFolderQuery struct {
	FolderUID string
	OrgID     int64
}

// TODO: CountDashboardsInFolderRequest is the request passed from the service
// to the store layer. The FolderID will be replaced with FolderUID when
// dashboards are updated with parent folder UIDs.
type CountDashboardsInFolderRequest struct {
	FolderID int64
	OrgID    int64
}

func FromDashboard(dash *Dashboard) *folder.Folder {
	return &folder.Folder{
		ID:        dash.ID,
		UID:       dash.UID,
		Title:     dash.Title,
		HasACL:    dash.HasACL,
		Url:       models.GetFolderUrl(dash.UID, dash.Slug),
		Version:   dash.Version,
		Created:   dash.Created,
		CreatedBy: dash.CreatedBy,
		Updated:   dash.Updated,
		UpdatedBy: dash.UpdatedBy,
	}
}
