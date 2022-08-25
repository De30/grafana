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
	deny = &backend.HasAccessResponse{HasAccess: false}
)

type AccessHandlerFactory func(user *user.SignedInUser) backend.AccessControl

func NewAccessHandlerFactory(acService accesscontrol.AccessControl) AccessHandlerFactory {
	return func(user *user.SignedInUser) backend.AccessControl {
		return &AccessHandler{
			ac:   acService,
			user: user,
			log:  log.New("accesscontrol.plugins"),
		}
	}
}

type AccessHandler struct {
	ac   accesscontrol.AccessControl
	user *user.SignedInUser
	log  log.Logger
}

func (ah *AccessHandler) HasAccess(ctx context.Context, req *backend.HasAccessRequest) (*backend.HasAccessResponse, error) {
	ev, err := toEvaluator(req.Evaluator)
	if err != nil {
		ah.log.Error("could not convert evaluator", "ev", fmt.Sprintf("%v", ev), "error", err)
		return deny, nil
	}

	hasAccess, err := ah.ac.Evaluate(ctx, ah.user, ev)
	if err != nil {
		ah.log.Error("error evaluating user rights", "error", err)
		return deny, nil
	}

	return &backend.HasAccessResponse{HasAccess: hasAccess}, nil
}
