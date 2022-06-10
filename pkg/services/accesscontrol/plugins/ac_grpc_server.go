package plugins

import (
	context "context"

	"github.com/grafana/grafana/pkg/services/accesscontrol"
)

// RegisterAccessControlServer

type ServerImpl struct {
	ac accesscontrol.AccessControl
}

func ProvideAccessControlServer(ac accesscontrol.AccessControl) AccessControlServer {
	return &ServerImpl{ac: ac}
}

func (s *ServerImpl) Status(_ context.Context, _ *Void) (*StatusResponse, error) {
	panic("not implemented") // TODO: Implement
}

func (s *ServerImpl) RegisterPluginRoles(_ context.Context, _ *RegisterPluginRolesRequest) (*RegisterPluginRolesResponse, error) {
	panic("not implemented") // TODO: Implement
}

func (s *ServerImpl) HasAccess(_ context.Context, _ *HasAccessRequest) (*HasAccessResponse, error) {
	panic("not implemented") // TODO: Implement
}

func (s *ServerImpl) mustEmbedUnimplementedAccessControlServer() {
	panic("not implemented") // TODO: Implement
}
