package store

import (
	"context"

	"github.com/grafana/grafana/pkg/plugins/backendplugin/pluginextensionv2"
)

type API struct {
	pluginextensionv2.UnimplementedStoreServer
}

func (api *API) ListStore(ctx context.Context, request *pluginextensionv2.ListRequest) (*pluginextensionv2.ListResponse, error) {
	//TODO implement me
	panic("implement me")
}

func (api *API) GetEntity(ctx context.Context, request *pluginextensionv2.GetRequest) (*pluginextensionv2.GetResponse, error) {
	//TODO implement me
	panic("implement me")
}

func (api *API) WriteEntity(ctx context.Context, request *pluginextensionv2.WriteRequest) (*pluginextensionv2.WriteResponse, error) {
	//TODO implement me
	panic("implement me")
}

func (api *API) DeleteEntity(ctx context.Context, request *pluginextensionv2.DeleteRequest) (*pluginextensionv2.DeleteResponse, error) {
	//TODO implement me
	panic("implement me")
}

// WatchStore ...
// 1. List all storage periodically for rebuilding index.
// 2. We can add watch to avoid re-index on every change.
// 3. We can add reliable watch (like via persistent bus between).
func (api *API) WatchStore(request *pluginextensionv2.WatchRequest, server pluginextensionv2.Store_WatchStoreServer) error {
	//TODO implement me
	panic("implement me")
}
