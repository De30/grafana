package api

import (
	"net/http"
	"strconv"

	"github.com/grafana/grafana/pkg/api/response"
	"github.com/grafana/grafana/pkg/models"
	"github.com/grafana/grafana/pkg/services/webauth"
	"github.com/grafana/grafana/pkg/util"
	"github.com/grafana/grafana/pkg/web"
)

func (hs *HTTPServer) GetCreationOptions(c *models.ReqContext) response.Response {
	options, err := hs.webauthService.GenerateCredentialCreationOptions(c, &webauth.CreationOptions{
		Name:  c.NameOrFallback(),
		Email: c.Email,
	})
	if err != nil {
		return response.Error(http.StatusInternalServerError, "error generating credential creation options", err)
	}

	return response.JSON(http.StatusOK, options)
}

func (hs *HTTPServer) RegisterNewCredential(c *models.ReqContext) response.Response {
	registerRequest := webauth.RegisterCredentialDTO{}
	if err := web.Bind(c.Req, &registerRequest); err != nil {
		return response.Error(http.StatusBadRequest, "bad request data", err)
	}

	credentialCreationData, err := hs.webauthService.ValidateClientRequest(c.Req.Context(), &webauth.SignUpRequestDTO{
		Name:           c.NameOrFallback(),
		Email:          c.Email,
		CredentialList: []webauth.CredentialCreationResponse{registerRequest.Credential},
	})
	if err != nil {
		return response.Error(http.StatusInternalServerError, "Could not validate client request data.", err)
	}

	credentials, err := hs.webauthService.RegisterCredentials(c, &webauth.RegisterCredentialsCommand{
		UserID:                 c.UserID,
		CredentialCreationData: credentialCreationData,
	})
	if err != nil || len(credentials) == 0 {
		return response.Error(http.StatusInternalServerError, "Could not register new credential.", err)
	}

	return response.JSON(http.StatusCreated, util.DynMap{
		"name":      credentials[0].Name,
		"id":        credentials[0].ID,
		"createdAt": credentials[0].Created,
	})
}

func (hs *HTTPServer) DeleteUserCredential(c *models.ReqContext) response.Response {
	id, err := strconv.ParseInt(web.Params(c.Req)[":id"], 10, 64)
	if err != nil {
		return response.Error(http.StatusBadRequest, "id is invalid", err)
	}

	if err := hs.webauthService.DeleteCredential(c.Req.Context(), id); err != nil {
		return response.Error(http.StatusInternalServerError, err.Error(), err)
	}

	return response.Success("Credential successfully deleted.")
}
