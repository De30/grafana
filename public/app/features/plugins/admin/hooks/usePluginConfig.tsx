import { useAsync } from 'react-use';

import { loadPlugin } from '../../utils';
import { CatalogPlugin } from '../types';

export const usePluginConfig = (plugin?: CatalogPlugin) => {
  console.log('usePluginConfig');
  return useAsync(async () => {
    if (!plugin) {
      return null;
    }

    if (plugin.isInstalled && !plugin.isDisabled) {
      return loadPlugin(plugin.id);
    }
    return null;
  }, [plugin?.id, plugin?.isInstalled, plugin?.isDisabled]);
};
