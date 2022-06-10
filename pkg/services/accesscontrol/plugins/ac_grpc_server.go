package plugins

import (
	context "context"
	"fmt"

	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/web"
)

// RegisterAccessControlServer

type ServerImpl struct {
	ac accesscontrol.AccessControl
	UnimplementedAccessControlServer
}

func ProvideAccessControlServer(ac accesscontrol.AccessControl) AccessControlServer {
	s := &ServerImpl{ac: ac}
	// RegisterAccessControlServer(s)
	return s
}

func (s *ServerImpl) IsDisabled(_ context.Context, _ *Void) (*IsDisabledResponse, error) {
	resp := &IsDisabledResponse{
		IsDisabled: !s.ac.IsDisabled(),
	}
	return resp, nil
}

func (s *ServerImpl) RegisterPluginRoles(_ context.Context, req *RegisterPluginRolesRequest) (*RegisterPluginRolesResponse, error) {
	// Early return if no registration
	if req == nil || len(req.Registrations) == 0 {
		return &RegisterPluginRolesResponse{}, nil
	}

	grpcRegs := req.Registrations
	registrations := []accesscontrol.RoleRegistration{}
	for _, reg := range grpcRegs {
		registrations = append(registrations, reg.toRoleRegistration())
	}

	// TODO add checks on the role and its perms to ensure they are valid (only target the plugin).

	err := s.ac.DeclareFixedRoles(registrations...)
	if err != nil {
		return &RegisterPluginRolesResponse{
			Error: &Error{Error: fmt.Sprintf("Could not register roles: %v", err)},
		}, err
	}

	return &RegisterPluginRolesResponse{}, nil
}

func (s *ServerImpl) HasAccess(c context.Context, req *HasAccessRequest) (*HasAccessResponse, error) {
	// Early return if request
	switch {
	case req == nil:
		return &HasAccessResponse{HasAccess: false}, nil
	case req.User == nil:
		return &HasAccessResponse{HasAccess: false}, &noUserProvided{}
	case req.Evaluator == nil:
		return &HasAccessResponse{HasAccess: false}, &noEvaluatorProvided{}
	}

	ev, err := req.Evaluator.toEvaluator()
	if err != nil {
		return &HasAccessResponse{HasAccess: false}, err
	}

	// TODO test this
	hasAccess := accesscontrol.HasAccess(s.ac, &models.ReqContext{Context: web.FromContext(c), SignedInUser: req.User.toSignedInUser()})

	return &HasAccessResponse{HasAccess: hasAccess(func(rc *models.ReqContext) bool { return false }, ev)}, nil
}
