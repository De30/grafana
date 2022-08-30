package webauthimpl

import (
	"bytes"
	"context"
	"crypto/rand"
	"encoding/base64"
	"encoding/binary"
	"errors"
	"math"
	"math/big"
	"time"

	"github.com/duo-labs/webauthn/protocol"
	"github.com/duo-labs/webauthn/webauthn"
	"github.com/grafana/grafana/pkg/infra/localcache"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/sqlstore"
	"github.com/grafana/grafana/pkg/services/sqlstore/db"
	"github.com/grafana/grafana/pkg/services/user"
	"github.com/grafana/grafana/pkg/services/webauth"
	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

// Typed errors
var (
	ErrHandleGeneration = errors.New("unable to generate user handle")
	ErrSignup           = errors.New("failed to create signup")
	ErrSessionCreation  = errors.New("unable to create new session")
	ErrSessionLoad      = errors.New("failed to load session data")
	ErrCredCreation     = errors.New("unable to create credential")
	ErrNoCredentials    = errors.New("user has no credentials registered")
	ErrCredRegistered   = errors.New("credential is already registered")
)

type Service struct {
	store        store
	userService  user.Service
	wauth        *webauthn.WebAuthn
	sessionStore *webauth.SessionStore
	db           db.DB
}

func ProvideService(cfg *setting.Cfg, db db.DB, cacheService *localcache.CacheService, userService user.Service) (webauth.Service, error) {
	authn, err := webauthn.New(&webauthn.Config{
		RPDisplayName: "Grafana",
		RPID:          cfg.Domain,
		RPOrigin:      cfg.AppURL,
	})
	if err != nil {
		return nil, err
	}

	sessionStore := webauth.NewSessionStore(time.Minute * 5)

	return &Service{
		store: &sqlStore{
			db: db,
		},
		userService:  userService,
		sessionStore: sessionStore,
		wauth:        authn,
		db:           db,
	}, nil
}

func generateUserHandle() (int64, error) {
	userHandle, err := rand.Int(rand.Reader, big.NewInt(math.MaxInt64))
	if err != nil {
		return -1, err
	}

	return userHandle.Int64(), nil
}

func (s *Service) getUserFromSession(sessionData *webauthn.SessionData, name string, email string) *webauth.User {
	return &webauth.User{
		UserHandle: int64(binary.LittleEndian.Uint64(sessionData.UserID)),
		Name:       name,
		Email:      email,
	}
}

func (s *Service) AddCredential(ctx context.Context, userID int64, credentials ...*webauth.Credential) ([]webauth.WebauthnCredential, error) {
	return s.store.AddCredential(ctx, userID, credentials...)
}

func (s *Service) DeleteCredential(ctx context.Context, ID int64) error {
	return s.store.DeleteCredential(ctx, ID)
}

func (s *Service) ValidateClientRequest(ctx context.Context, signUpRequest *webauth.SignUpRequestDTO) ([]webauth.ParsedCredentialCreationData, error) {
	if len(signUpRequest.Email) <= 0 {
		return nil, errors.New("email must have non-zero length")
	}

	parsedCcdList := make([]webauth.ParsedCredentialCreationData, len(signUpRequest.CredentialList))
	for i, ccr := range signUpRequest.CredentialList {
		if ccr.ID == "" {
			return nil, protocol.ErrBadRequest.WithDetails("Parse error for Registration").WithInfo("Missing ID")
		}

		testB64, err := base64.RawURLEncoding.DecodeString(ccr.ID)
		if err != nil || !(len(testB64) > 0) {
			return nil, protocol.ErrBadRequest.WithDetails("Parse error for Registration").WithInfo("ID not base64.RawURLEncoded")
		}

		exists, err := s.store.CredentialExists(ctx, testB64)
		if exists {
			return nil, ErrCredRegistered
		} else if err != nil {
			return nil, err
		}

		if ccr.PublicKeyCredential.Credential.Type == "" {
			return nil, protocol.ErrBadRequest.WithDetails("Parse error for Registration").WithInfo("Missing type")
		}

		if ccr.PublicKeyCredential.Credential.Type != "public-key" {
			return nil, protocol.ErrBadRequest.WithDetails("Parse error for Registration").WithInfo("Type not public-key")
		}

		var pcc protocol.ParsedCredentialCreationData
		pcc.ID, pcc.RawID, pcc.Type = ccr.ID, ccr.RawID, ccr.Type
		pcc.Raw = ccr.CredentialCreationResponse

		parsedAttestationResponse, err := ccr.AttestationResponse.Parse()
		if err != nil {
			return nil, protocol.ErrParsingData.WithDetails("Error parsing attestation response")
		}

		pcc.Response = *parsedAttestationResponse
		parsedCcdList[i] = webauth.ParsedCredentialCreationData{ParsedCredentialCreationData: pcc, Name: ccr.Name}
	}

	return parsedCcdList, nil
}

func (s *Service) RegisterCredentials(ctx *models.ReqContext, command *webauth.RegisterCredentialsCommand) ([]webauth.WebauthnCredential, error) {
	sessionData, err := s.sessionStore.Get(ctx)
	if err != nil {
		return nil, err
	}

	theUser, err := s.userService.GetByID(ctx.Req.Context(), &user.GetUserByIDQuery{ID: command.UserID})
	if err != nil {
		return nil, err
	}

	usrName := theUser.NameOrFallback()
	usr := s.getUserFromSession(sessionData, usrName, theUser.Email)

	credentials := make([]*webauth.Credential, len(command.CredentialCreationData))
	var registeredCredentials []webauth.WebauthnCredential
	err = s.db.WithTransactionalDbSession(ctx.Req.Context(), func(sess *sqlstore.DBSession) error {
		for i, credData := range command.CredentialCreationData {
			newCred, err := s.wauth.CreateCredential(usr, *sessionData, &credData.ParsedCredentialCreationData)
			if err != nil {
				return ErrCredCreation
			}

			credentials[i] = &webauth.Credential{Credential: newCred, Name: credData.Name}
		}

		registeredCredentials, err = s.AddCredential(ctx.Req.Context(), command.UserID, credentials...)
		return err
	})
	return registeredCredentials, err
}

func (s *Service) SignUp(ctx *models.ReqContext, signUpCommand *webauth.WebAuthnSignUpCommand) (*user.User, error) {
	var newUser *user.User

	sessionData, err := s.sessionStore.Get(ctx)
	if err != nil {
		return nil, err
	}

	err = s.db.WithTransactionalDbSession(ctx.Req.Context(), func(sess *sqlstore.DBSession) error {
		req := ctx.Req

		usr := s.getUserFromSession(sessionData, signUpCommand.Name, signUpCommand.Email)
		createUserCmd := user.CreateUserCommand{
			Email:          usr.Email,
			Login:          usr.Email,
			Name:           usr.Name,
			Password:       "",
			OrgName:        "",
			WebauthnHandle: usr.UserHandle,
		}

		newUser, err = s.userService.Create(ctx.Req.Context(), &createUserCmd)
		if err != nil {
			return err
		}

		credentials := make([]*webauth.Credential, len(signUpCommand.CredentialCreationData))
		for i, credData := range signUpCommand.CredentialCreationData {
			newCred, err := s.wauth.CreateCredential(usr, *sessionData, &credData.ParsedCredentialCreationData)
			if err != nil {
				return ErrCredCreation
			}

			credentials[i] = &webauth.Credential{Credential: newCred, Name: credData.Name}
		}

		// store credentials in DB
		_, err = s.AddCredential(req.Context(), newUser.ID, credentials...)
		return err
	})

	return newUser, err
}

func (s *Service) LogIn(ctx *models.ReqContext) (*user.User, error) {
	loginOrEmail := web.Params(ctx.Req)[":user"]
	usr, err := s.userService.GetByLogin(ctx.Req.Context(), &user.GetUserByLoginQuery{LoginOrEmail: loginOrEmail})
	if err != nil {
		return nil, err
	}

	creds, err := s.store.GetCredentials(ctx.Req.Context(), usr.ID)
	if err != nil {
		return nil, err
	}

	credss := make([]webauthn.Credential, len(creds))
	for i, cred := range creds {
		credss[i] = *cred.Credential
	}
	webauthUser := &webauth.User{
		UserHandle:  usr.WebauthnHandle,
		UserId:      usr.ID,
		Name:        usr.Name,
		Email:       usr.Email,
		Credentials: credss,
	}

	sessionData, err := s.sessionStore.Get(ctx)
	if err != nil {
		return nil, err
	}

	usedCred, err := s.wauth.FinishLogin(webauthUser, *sessionData, ctx.Req)
	var validCred *webauth.Credential
	for _, cr := range creds {
		if bytes.Equal(cr.ID, usedCred.ID) {
			validCred = &cr
			break
		}
	}

	if usedCred.Authenticator.SignCount != 0 || validCred.Authenticator.SignCount != 0 {
		if usedCred.Authenticator.SignCount > validCred.Authenticator.SignCount {
			s.store.UpdateSignCount(ctx.Req.Context(), validCred.LocalID, usedCred.Authenticator.SignCount)
		} else {
			// Authenticator is possibly cloned
			// maybe warn user or something?
		}
	}

	return usr, err
}

func (s *Service) GetUserCredentials(c *models.ReqContext, userID int64) ([]models.CredentialInfoDTO, error) {
	creds, err := s.store.GetCredentials(c.Req.Context(), userID)
	if err != nil {
		return nil, err
	}

	credInfo := make([]models.CredentialInfoDTO, len(creds))
	for i, cred := range creds {
		credInfo[i] = models.CredentialInfoDTO{
			ID:        cred.LocalID,
			Name:      cred.Name,
			CreatedAt: cred.Created,
		}
	}

	return credInfo, nil
}

func (s *Service) GenerateCredentialCreationOptions(c *models.ReqContext, usr *webauth.CreationOptions) (*protocol.CredentialCreation, error) {
	exUser, err := s.userService.GetByEmail(c.Req.Context(), &user.GetUserByEmailQuery{Email: usr.Email})
	var userHandle int64
	if err == nil {
		userHandle = exUser.WebauthnHandle
	} else {
		userHandle, err = generateUserHandle()
		if err != nil {
			return nil, ErrHandleGeneration
		}
	}

	regUser := &webauth.User{
		UserHandle: userHandle,
		UserId:     -1,
		Name:       usr.NameOrFallback(),
		Email:      usr.Email,
	}
	if exUser != nil {
		regUser.UserId = exUser.ID
	}

	var credentialExcludeList []protocol.CredentialDescriptor
	if regUser.UserId >= 0 {
		registeredCreds, err := s.store.GetCredentials(c.Req.Context(), exUser.ID)
		if err == nil {
			for _, cred := range registeredCreds {
				credentialExcludeList = append(credentialExcludeList, protocol.CredentialDescriptor{
					Type:         protocol.PublicKeyCredentialType,
					CredentialID: cred.ID,
				})
			}
		}
	}

	options, sessionData, err := s.wauth.BeginRegistration(regUser, func(pkcco *protocol.PublicKeyCredentialCreationOptions) {
		pkcco.CredentialExcludeList = credentialExcludeList
	})
	if err != nil {
		return nil, ErrSignup
	}

	s.sessionStore.Set(c.Resp, util.GenerateShortUID(), sessionData)

	return options, nil
}

func (s *Service) GenerateCredentialRequestOptions(c *models.ReqContext, usr *user.User) (*protocol.CredentialAssertion, error) {
	creds, err := s.store.GetCredentials(c.Req.Context(), usr.ID)
	if err != nil {
		return nil, err
	} else if len(creds) <= 0 {
		return nil, ErrNoCredentials
	}

	credss := make([]webauthn.Credential, len(creds))
	for i, cred := range creds {
		credss[i] = *cred.Credential
	}
	webauthUser := webauth.User{
		UserHandle:  usr.WebauthnHandle,
		UserId:      usr.ID,
		Name:        usr.Name,
		Email:       usr.Email,
		Credentials: credss,
	}

	options, sessionData, err := s.wauth.BeginLogin(&webauthUser)
	if err != nil {
		return nil, err
	}

	s.sessionStore.Set(c.Resp, util.GenerateShortUID(), sessionData)

	return options, nil
}
