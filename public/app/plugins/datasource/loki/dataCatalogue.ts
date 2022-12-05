import { DataCatalogueBuilder, DataCatalogueContext, DataCatalogueItem } from '@grafana/data';

import { LokiDatasource } from './datasource';

export const getRootDataCatalogueItem = async ({
  context,
  datasource,
}: {
  datasource: LokiDatasource;
  context: DataCatalogueContext;
}): Promise<DataCatalogueItem> => {
  const data = (item: DataCatalogueBuilder) => {
    item.setItems([
      new DataCatalogueBuilder('Labels').loadItems(async () => {
        const labels = await datasource.labelNamesQuery();
        return labels.map((label: { text: string }) => {
          return {
            name: label.text,
            items: async () => {
              const values = await datasource.labelValuesQuery(label.text);
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
      }),
    ]);
  };

  const status = (item: DataCatalogueBuilder) => {
    item.setItems([
      new DataCatalogueBuilder('Build info').loadAttributes(async () => {
        const config = datasource.metadataRequest('status/buildinfo');
        console.log(config);
      }),
    ]);
  };

  return new DataCatalogueBuilder().fromDataSource(datasource, { data, status });
};
