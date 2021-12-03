package sqlstore

import (
	"context"
)

func (ss *SQLStore) GetAllRemotePlugins(ctx context.Context) (map[string]string, error) {
	results, err := x.QueryString("select * from remote_plugin")
	if err != nil {
		return nil, err
	}

	ret := make(map[string]string, len(results))
	for _, r := range results {
		key := r["plugin_id"]
		value := r["route"]
		ret[key] = value
	}

	return ret, nil
}

func (ss *SQLStore) DeleteRemotePlugin(ctx context.Context, pluginID string) error {
	_, err := x.Exec("delete from plugin_info where plugin_id = ?", pluginID)
	return err
}
