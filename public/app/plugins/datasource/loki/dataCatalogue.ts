import { DataCatalogueBuilder, DataCatalogueContext, DataCatalogueItem } from '@grafana/data';

import { LokiDatasource } from './datasource';
import { LokiQuery } from './types';

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
          return new DataCatalogueBuilder(label.text, 'Label').loadItems(async () => {
            const values = await datasource.labelValuesQuery(label.text);
            return values.map((value: { text: string }) =>
              new DataCatalogueBuilder(value.text, 'Label value')
                .addKeyValue('Label', label.text)
                .addKeyValue('Label value', value.text)
                .addRunQueryAction<Omit<LokiQuery, 'refId'>>(
                  'Show data',
                  {
                    expr: `{${label.text}="${value.text}"}`,
                  },
                  context
                )
            );
          });
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

  return new DataCatalogueBuilder().fromDataSource(datasource, context, { data, status });
};
