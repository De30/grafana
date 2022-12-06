import {
  DataCatalogueContext,
  DataCatalogueItem,
  DataCatalogueBuilder,
  isDataCatalogueContextWithQuery,
} from '@grafana/data';

import { SQLQuery } from '../../../features/plugins/sql';

import { MySqlDatasource } from './MySqlDatasource';

export const getRootDataCatalogueItem = ({
  context,
  datasource,
}: {
  context: DataCatalogueContext;
  datasource: MySqlDatasource;
}) => {
  const data = (item: DataCatalogueBuilder) => {
    item.setItems([
      new DataCatalogueBuilder('Schemas').loadItems(async () => {
        const datasets = await datasource.fetchDatasets();
        return datasets.map((dataset: string) => {
          const schema = new DataCatalogueBuilder(dataset, 'Schema');
          schema.loadItems(async () => {
            const tables = await datasource.fetchTables(dataset);
            schema.addKeyValue('Total tables', tables.length.toString());
            return tables.map((table) => {
              return new DataCatalogueBuilder('table', 'Table').loadAttributes(async (item: DataCatalogueBuilder) => {
                const fields = await datasource.fetchFields({ table, dataset });
                fields.forEach(({ name, type }) => {
                  item.addKeyValue(name, type || 'unknown');
                });
                item.addAction('Show data for this table', () => {
                  if (isDataCatalogueContextWithQuery<SQLQuery>(context)) {
                    context.changeQuery({ refId: context.queryRefId, dataset, table });
                    context.runQuery();
                    context.closeDataCatalogue();
                  }
                });
              });
            }) as DataCatalogueItem[];
          });
          return schema;
        });
      }),
    ]);
  };

  return new DataCatalogueBuilder().fromDataSource(datasource, context, { data });
};
