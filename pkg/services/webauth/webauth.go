package webauth

import (
	"context"
	"time"

	"github.com/duo-labs/webauthn/protocol"
	"github.com/duo-labs/webauthn/webauthn"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/user"
)

type Service interface {
	GenerateCredentialCreationOptions(c *models.ReqContext, options *CreationOptions) (*protocol.CredentialCreation, error)
	GenerateCredentialRequestOptions(*models.ReqContext, *user.User) (*protocol.CredentialAssertion, error)
	ValidateClientRequest(context.Context, *SignUpRequestDTO) ([]ParsedCredentialCreationData, error)
	AddCredential(context.Context, int64, ...*Credential) ([]WebauthnCredential, error)
	DeleteCredential(context.Context, int64) error
	GetUserCredentials(*models.ReqContext, int64) ([]models.CredentialInfoDTO, error)
	RegisterCredentials(*models.ReqContext, *RegisterCredentialsCommand) ([]WebauthnCredential, error)
	SignUp(*models.ReqContext, *WebAuthnSignUpCommand) (*user.User, error)
	LogIn(*models.ReqContext) (*user.User, error)
}

type RegisterCredentialDTO struct {
	Credential CredentialCreationResponse `json:"credential"`
}

type SignUpRequestDTO struct {
	Name           string         `json:"name,omitempty"`
	Email          string         `json:"email"`
	CredentialList CredentialList `json:"credentialList"`
}

type ParsedCredentialCreationData struct {
	protocol.ParsedCredentialCreationData
	Name string
}

type WebAuthnSignUpCommand struct {
	CredentialCreationData []ParsedCredentialCreationData
	Name                   string
	Email                  string
}

type CredentialCreationResponse struct {
	protocol.CredentialCreationResponse
	Name string `json:"name"`
}
type CredentialList []CredentialCreationResponse

type Credential struct {
	*webauthn.Credential
	Name       string
	LocalID    int64
	UserHandle int64
	Created    time.Time
}

type RegisterCredentialsCommand struct {
	UserID                 int64
	CredentialCreationData []ParsedCredentialCreationData
}
