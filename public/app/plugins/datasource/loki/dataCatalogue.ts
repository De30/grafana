import { DataCatalogueDatasourceFolderBuilder, DataCatalogueFolder, DataSourceInstanceSettings } from '@grafana/data';

import { LokiDatasource } from './datasource';

type Deps = {
  datasource: LokiDatasource;
  instanceSettings: DataSourceInstanceSettings;
};

export const getRootDataCatalogueFolder = async (deps: Deps): Promise<DataCatalogueFolder> => {
  return new DataCatalogueDatasourceFolderBuilder(deps.datasource).loadItems(async () => {
    return [await getLabelsDataCatalogueFolder(deps), await getConfigDataCatalogueFolder(deps)];
  });
};

export const getConfigDataCatalogueFolder = async (deps: Deps) => {
  const config = deps.datasource.metadataRequest('status/buildinfo');
  console.log(config);
  return {
    name: 'Config',
  };
};

export const getLabelsDataCatalogueFolder = async (deps: Deps) => {
  return {
    name: 'Labels',
    items: async () => {
      const labels = await deps.datasource.labelNamesQuery();
      return labels.map((label: { text: string }) => {
        return {
          name: label.text,
          items: async () => {
            const values = await deps.datasource.labelValuesQuery(label.text);
            return values.map((value: { text: string }) => {
              return {
                name: value.text,
                actions: [
                  {
                    name: 'show data',
                    handler: () => {
                      alert('Clicked on ' + label.text + ' ' + value.text);
                    },
                  },
                ],
              };
            });
          },
        };
      });
    },
  };
};
