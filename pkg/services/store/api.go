package store

import (
	"context"

	"github.com/grafana/grafana/pkg/models"

	"github.com/grafana/grafana/pkg/plugins/backendplugin/pluginextensionv2"
)

// API is not used yet – but we added it to make sure interface we are creating
// will be nice to work with from the outside of Grafana.
type API struct {
	pluginextensionv2.UnimplementedStoreServer
	store StorageService
}

func (api *API) ListStore(ctx context.Context, request *pluginextensionv2.ListRequest) (*pluginextensionv2.ListResponse, error) {
	user := &models.SignedInUser{} // TODO: extract user.
	return api.store.List(ctx, user, request)
}

func (api *API) GetEntity(ctx context.Context, request *pluginextensionv2.GetRequest) (*pluginextensionv2.GetResponse, error) {
	user := &models.SignedInUser{} // TODO: extract user.
	return api.store.Read(ctx, user, request)
}

func (api *API) WriteEntity(ctx context.Context, request *pluginextensionv2.WriteRequest) (*pluginextensionv2.WriteResponse, error) {
	user := &models.SignedInUser{} // TODO: extract user.
	return api.store.Write(ctx, user, request)
}

func (api *API) DeleteEntity(ctx context.Context, request *pluginextensionv2.DeleteRequest) (*pluginextensionv2.DeleteResponse, error) {
	user := &models.SignedInUser{} // TODO: extract user.
	return api.store.Delete(ctx, user, request)
}

// WatchStore ...
// 1. List all storage periodically for rebuilding index.
// 2. We can add watch to avoid re-index on every change.
// 3. We can add reliable watch (like via persistent bus between).
func (api *API) WatchStore(request *pluginextensionv2.WatchRequest, server pluginextensionv2.Store_WatchStoreServer) error {
	//TODO implement me
	panic("implement me")
}
