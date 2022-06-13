package plugins

import (
	context "context"
	"fmt"
	"net"
	"net/http"

	"github.com/grafana/grafana/pkg/infra/log"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/accesscontrol"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/web"
	"google.golang.org/grpc"
)

type ServerImpl struct {
	ac     accesscontrol.AccessControl
	logger log.Logger
	UnimplementedAccessControlServer
}

func ProvideAccessControlServer(lis net.Listener, ac accesscontrol.AccessControl, cfg *setting.Cfg) (AccessControlServer, error) {
	s := &ServerImpl{ac: ac, logger: log.New("accesscontrol.plugins")}
	grpcServer := grpc.NewServer()
	RegisterAccessControlServer(grpcServer, s)

	go func() {
		if errGrpcServe := grpcServer.Serve(lis); errGrpcServe != nil {
			s.logger.Error("accesscontrol grpc server stopped", "error", errGrpcServe)
		}
	}()
	return s, nil
}

func (s *ServerImpl) IsDisabled(_ context.Context, _ *Void) (*IsDisabledResponse, error) {
	s.logger.Debug("IsDisabled called")
	resp := &IsDisabledResponse{
		IsDisabled: s.ac.IsDisabled(),
	}
	return resp, nil
}

func (s *ServerImpl) RegisterPluginRoles(_ context.Context,
	req *RegisterPluginRolesRequest) (*RegisterPluginRolesResponse, error) {
	// Early return if no registration
	if req == nil || len(req.Registrations) == 0 {
		s.logger.Debug("No registration provided")
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
		s.logger.Error("Could not register roles", "error", err)
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
		s.logger.Debug("No request")
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
	s.logger.Debug("Parsed evaluator")

	// TODO replace this dirty hack
	reqCtx := &models.ReqContext{
		Context:      &web.Context{Req: (&http.Request{}).WithContext(c)},
		SignedInUser: req.User.toSignedInUser(),
	}
	hasAccess := accesscontrol.HasAccess(s.ac, reqCtx)

	return &HasAccessResponse{HasAccess: hasAccess(func(rc *models.ReqContext) bool { return false }, ev)}, nil
}
