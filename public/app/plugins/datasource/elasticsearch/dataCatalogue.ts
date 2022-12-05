import { DataCatalogueContext, DataCatalogueBuilder, isDataCatalogueContextWithQuery } from '@grafana/data';

import { ElasticDatasource } from './datasource';
import { ElasticsearchQuery } from './types';

type Deps = {
  datasource: ElasticDatasource;
  context: DataCatalogueContext;
};

export const getRootDataCatalogueItem = async (deps: Deps) => {
  const stats = await deps.datasource.getStats();
  const context = deps.context;

  return new DataCatalogueBuilder().fromDataSource(deps.datasource).setItems([
    new DataCatalogueBuilder('Indices').loadItems(async () => {
      let indexList = Object.keys(stats.indices);
      return indexList.map((indexName: string) =>
        new DataCatalogueBuilder(indexName, 'Index')
          .addKeyValue('Health', stats.indices[indexName].health)
          .addKeyValue('Status', stats.indices[indexName].status)
          .addKeyValue('Docs', stats.indices[indexName].total.docs.count)
          .addAction('Show data for this index', () => {
            if (isDataCatalogueContextWithQuery<ElasticsearchQuery>(context)) {
              context.changeQuery({
                refId: context.queryRefId,
                query: `_index:"${indexName}"`,
                metrics: [{ type: 'raw_data', id: '1' }],
              });
              context.runQuery();
              context.closeDataCatalogue();
            }
          })
          .loadItems(async () => {
            const mappings = await deps.datasource.getMappings(indexName);
            const properties = mappings[indexName]?.mappings.properties;
            return Object.keys(properties).map((propertyName) =>
              new DataCatalogueBuilder(propertyName, 'Field').addKeyValue('type', properties[propertyName].type)
            );
          })
      );
    }),
    new DataCatalogueBuilder('Features').loadItems(async () => {
      const features = await deps.datasource.getFeatures();
      return Object.keys(features).map((featureName) => {
        return new DataCatalogueBuilder(featureName, 'Feature')
          .addKeyValue('available', features[featureName].available ? 'yes' : 'no')
          .addKeyValue('enabled', features[featureName].enabled ? 'yes' : 'no');
      });
    }),
    new DataCatalogueBuilder('Stats')
      .addKeyValue('Docs', stats._all.total.docs.count)
      .addKeyValue('Field data memory', stats._all.total.fielddata.memory_size_in_bytes + 'B')
      .addKeyValue('Shards', stats._all.total.shard_stats.total_count),
  ]);
};
