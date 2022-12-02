package themesimpl

import (
	"net/http"
	"os"
	"path/filepath"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/infra/db"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/featuremgmt"
	"github.com/grafana/grafana/pkg/services/themes"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

type Service struct {
	cfg      *setting.Cfg
	features *featuremgmt.FeatureManager
}

func ProvideService(db db.DB, cfg *setting.Cfg, features *featuremgmt.FeatureManager) themes.Service {
	service := &Service{
		cfg:      cfg,
		features: features,
	}

	return service
}

// RegisterHTTPRoutes implements themes.Service
func (service *Service) RegisterHTTPRoutes(route routing.RouteRegister) {
	reqGrafanaAdmin := middleware.ReqSignedIn //.ReqGrafanaAdmin

	route.Group("/themes", func(r routing.RouteRegister) {
		r.Get("/:uid", routing.Wrap(service.handleApiGet))
		r.Post("/", routing.Wrap(service.handleApiCreate))
		r.Put("/:uid", routing.Wrap(service.handleApiUpdate))
		r.Get("/", routing.Wrap(service.handleApiGetAll))
	}, reqGrafanaAdmin)
}

// POST /api/themes
func (ts *Service) handleApiCreate(c *models.ReqContext) response.Response {
	theme := themes.CustomThemeDTO{}
	if err := web.Bind(c.Req, &theme); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	theme.UID = util.GenerateShortUID()

	if err := ts.saveTheme(&theme); err != nil {
		return response.Error(500, "Failed to save theme", err)
	}

	return response.JSON(200, theme)
}

// POST /api/themes/:uid
func (ts *Service) handleApiUpdate(c *models.ReqContext) response.Response {
	theme := themes.CustomThemeDTO{}

	if err := web.Bind(c.Req, &theme); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	theme.UID = web.Params(c.Req)[":uid"]

	if err := ts.saveTheme(&theme); err != nil {
		return response.Error(500, "Failed to save theme", err)
	}

	return response.JSON(200, theme)
}

// GET /api/themes/:uid
func (ts *Service) handleApiGet(c *models.ReqContext) response.Response {
	theme, err := ts.loadTheme(web.Params(c.Req)[":uid"])

	if err != nil {
		return response.Error(500, "Failed to load theme", err)
	}

	return response.JSON(200, theme)
}

// GET /api/themes
func (ts *Service) handleApiGetAll(c *models.ReqContext) response.Response {
	themes := []themes.CustomThemeDTO{}

	themesFolder, err := ts.getThemesFolderPath()
	if err != nil {
		return response.Error(500, "Failed get themes folder", err)
	}

	err = filepath.Walk(themesFolder, func(path string, f os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		if f.IsDir() {
			return nil
		}

		theme, err := ts.loadThemeFromFile(path)
		if err != nil {
			return err
		}

		themes = append(themes, *theme)
		return nil
	})

	if err != nil {
		return response.Error(500, "Failed to load theme", err)
	}

	return response.JSON(200, themes)
}
