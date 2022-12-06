package plugins

import pluginStoreLib "github.com/grafana/grafana/pkg/plugins/manager/loader"

type ErrorResolver struct {
	loader *pluginStoreLib.Loader
}

func ProvideErrorResolver(loader *pluginStoreLib.Loader) *ErrorResolver {
	return &ErrorResolver{loader: loader}
}

func (e ErrorResolver) PluginErrors() []*Error {
	var errs []*Error
	for _, e := range e.loader.PluginErrors() {
		errs = append(errs, &Error{
			PluginID:  e.PluginID,
			ErrorCode: e.ErrorCode,
		})
	}

	return errs
}
