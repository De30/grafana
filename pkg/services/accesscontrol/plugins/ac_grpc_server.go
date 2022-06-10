package plugins

import (
	context "context"
	"fmt"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
)

// RegisterAccessControlServer

type ServerImpl struct {
	ac accesscontrol.AccessControl
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
	grpcRegs := req.Registrations
	registrations := []accesscontrol.RoleRegistration{}
	for _, reg := range grpcRegs {
		registrations = append(registrations, accesscontrol.RoleRegistration{
			Role:   reg.Role.toRole(),
			Grants: reg.Grants,
		})
	}

	err := s.ac.DeclareFixedRoles(registrations...)
	if err != nil {
		return &RegisterPluginRolesResponse{
			Error: &Error{Error: fmt.Sprintf("Could not register roles: %v", err)},
		}, err
	}

	return &RegisterPluginRolesResponse{}, nil
}

func (s *ServerImpl) HasAccess(_ context.Context, _ *HasAccessRequest) (*HasAccessResponse, error) {
	panic("not implemented") // TODO: Implement
}

func (s *ServerImpl) mustEmbedUnimplementedAccessControlServer() {
	panic("not implemented") // TODO: Implement
}
