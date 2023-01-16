package supportbundlesimpl

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/api/routing"
	"github.com/grafana/grafana/pkg/middleware"
	"github.com/grafana/grafana/pkg/models"
	ac "github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/supportbundles"
	"github.com/grafana/grafana/pkg/web"
)

const rootUrl = "/api/support-bundles"

func (s *Service) registerAPIEndpoints(routeRegister routing.RouteRegister) {
	authorize := ac.Middleware(s.accessControl)

	routeRegister.Group(rootUrl, func(subrouter routing.RouteRegister) {
		subrouter.Get("/", authorize(middleware.ReqGrafanaAdmin,
			ac.EvalPermission(ActionRead)), routing.Wrap(s.handleList))
		subrouter.Post("/", authorize(middleware.ReqGrafanaAdmin,
			ac.EvalPermission(ActionCreate)), routing.Wrap(s.handleCreate))
		subrouter.Get("/:uid", authorize(middleware.ReqGrafanaAdmin,
			ac.EvalPermission(ActionRead)), s.handleDownload)
		subrouter.Delete("/:uid", authorize(middleware.ReqGrafanaAdmin,
			ac.EvalPermission(ActionDelete)), s.handleRemove)
		subrouter.Get("/collectors", authorize(middleware.ReqGrafanaAdmin,
			ac.EvalPermission(ActionCreate)), routing.Wrap(s.handleGetCollectors))
	})
}

func (s *Service) handleList(ctx *models.ReqContext) response.Response {
	bundles, err := s.list(ctx.Req.Context())
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to list bundles", err)
	}

	data, err := json.Marshal(bundles)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to encode bundle", err)
	}

	return response.JSON(http.StatusOK, data)
}

func (s *Service) handleCreate(ctx *models.ReqContext) response.Response {
	type command struct {
		Collectors []string `json:"collectors"`
	}

	var c command
	if err := web.Bind(ctx.Req, &c); err != nil {
		return response.Error(http.StatusBadRequest, "failed to parse request", err)
	}

	bundle, err := s.create(context.Background(), c.Collectors, ctx.SignedInUser)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to create support bundle", err)
	}

	data, err := json.Marshal(bundle)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to encode bundle", err)
	}

	return response.JSON(http.StatusCreated, data)
}

func (s *Service) handleDownload(ctx *models.ReqContext) response.Response {
	uid := web.Params(ctx.Req)[":uid"]
	bundle, err := s.get(ctx.Req.Context(), uid)
	if err != nil {
		return response.Redirect("/admin/support-bundles")
	}

	if bundle.State != supportbundles.StateComplete {
		return response.Redirect("/admin/support-bundles")
	}

	ctx.Resp.Header().Set("Content-Type", "application/tar+gzip")
	ctx.Resp.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s.tar.gz", uid))
	return response.CreateNormalResponse(ctx.Resp.Header(), bundle.TarBytes, http.StatusOK)
}

func (s *Service) handleRemove(ctx *models.ReqContext) response.Response {
	uid := web.Params(ctx.Req)[":uid"]
	err := s.remove(ctx.Req.Context(), uid)
	if err != nil {
		return response.Error(http.StatusInternalServerError, "failed to remove bundle", err)
	}

	return response.Respond(http.StatusOK, "successfully removed the support bundle")
}

func (s *Service) handleGetCollectors(ctx *models.ReqContext) response.Response {
	collectors := make([]supportbundles.Collector, 0, len(s.collectors))

	for _, c := range s.collectors {
		collectors = append(collectors, c)
	}

	return response.JSON(http.StatusOK, collectors)
}
