package plugins

import (
	"context"
	"fmt"

	"github.com/grafana/grafana-plugin-sdk-go/backend"
	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/services/user"
)

var (
	_ backend.AccessControl = &AccessHandler{}

	deny = &backend.HasAccessResponse{HasAccess: false}
)

type AccessHandler struct {
	acService   accesscontrol.AccessControl
	userService user.Service
	log         log.Logger
}

func ProvideHasAccessHandler(ac accesscontrol.AccessControl, userService user.Service) *AccessHandler {
	return &AccessHandler{
		acService:   ac,
		userService: userService,
		log:         log.New("accesscontrol.plugins"),
	}
}

func (ph *AccessHandler) HasAccess(ctx context.Context, req *backend.HasAccessRequest) (*backend.HasAccessResponse, error) {
	if req.User == nil {
		return deny, user.ErrUserNotFound
	}

	// TODO figure out how to get the Org
	user, err := ph.userService.GetSignedInUser(ctx, &user.GetSignedInUserQuery{Login: req.User.Login, Email: req.User.Email, OrgID: 1})
	if err != nil {
		ph.log.Error("could not retrieve user", "user", fmt.Sprintf("%v", user), "error", err)
		return deny, nil
	}

	ev, err := toEvaluator(req.Evaluator)
	if err != nil {
		ph.log.Error("could not convert evaluator", "ev", fmt.Sprintf("%v", ev), "error", err)
		return deny, nil
	}

	hasAccess, err := ph.acService.Evaluate(ctx, user, ev)
	if err != nil {
		ph.log.Error("error evaluating user rights", "error", err)
		return deny, nil
	}

	return &backend.HasAccessResponse{HasAccess: hasAccess}, nil
}
