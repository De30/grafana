import {
  DataCatalogueContext,
  DataCatalogueDatasourceFolderBuilder,
  DataCatalogueFolderBuilder,
  DataCatalogueItem,
  DataCatalogueItemBuilder,
  isDataCatalogueContextWithQuery,
} from '@grafana/data';

import { SQLQuery } from '../../../features/plugins/sql';

import { MySqlDatasource } from './MySqlDatasource';

export const getRootDataCatalogueFolder = (context: DataCatalogueContext<SQLQuery>, datasource: MySqlDatasource) => {
  return new DataCatalogueDatasourceFolderBuilder(datasource).setItems([
    new DataCatalogueFolderBuilder('Schemas').loadItems(async () => {
      const datasets = await datasource.fetchDatasets();
      return datasets.map((dataset: string) => {
        const schema = new DataCatalogueFolderBuilder(dataset, 'Schema');
        schema.loadItems(async () => {
          const tables = await datasource.fetchTables(dataset);
          schema.addKeyValue('Total tables', tables.length);
          return tables.map((table) => {
            return new DataCatalogueItemBuilder('table', 'Table').loadAttributes(
              async (item: DataCatalogueItemBuilder) => {
                const fields = await datasource.fetchFields({ table, dataset });

                const meta = await datasource.fetchMeta({ table, schema: dataset });
                console.log('meta', meta);

                fields.forEach(({ name, type }) => {
                  item.addKeyValue(name, type || 'unknown');
                });
                item.addAction('Show data for this table', () => {
                  if (isDataCatalogueContextWithQuery(context)) {
                    context.changeQuery({ refId: context.queryRefId, dataset, table });
                    context.runQuery();
                    context.closeDataCatalogue();
                  }
                });
              }
            );
          }) as DataCatalogueItem[];
        });
        return schema;
      });
    }),
  ]);
};
