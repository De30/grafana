import { DataCatalogueContext, DataCatalogueBuilder } from '@grafana/data';

import { ElasticDatasource } from './datasource';
import { ElasticsearchQuery } from './types';

export const getRootDataCatalogueItem = async ({
  datasource,
  context,
}: {
  datasource: ElasticDatasource;
  context: DataCatalogueContext;
}) => {
  const stats = await datasource.getStats();

  const { license, build, features } = await datasource.getMeta();

  const data = (item: DataCatalogueBuilder) => {
    item
      .addLink(
        'https://grafana.com/docs/grafana/latest/datasources/elasticsearch/query-editor/',
        'Learn how to use query editor and write queries'
      )
      .setItems([
        new DataCatalogueBuilder('Indices')
          .addDescription(
            'An index can be thought of as an optimized collection of documents and each document is a collection of fields, which are the key-value pairs that contain your data.'
          )
          .addLink(
            'https://www.elastic.co/guide/en/elasticsearch/reference/current/documents-indices.html',
            'Learn mode about Elastic Indices'
          )
          .loadItems(async () => {
            let indexList = Object.keys(stats.indices);
            return indexList.map((indexName: string) =>
              new DataCatalogueBuilder(indexName, 'Index')
                .addKeyValue('Health', stats.indices[indexName].health)
                .addKeyValue('Status', stats.indices[indexName].status)
                .addKeyValue('Docs', stats.indices[indexName].total.docs.count)
                .addRunQueryAction<Omit<ElasticsearchQuery, 'refId'>>(
                  'Show data for this index',
                  {
                    query: `_index:"${indexName}"`,
                    metrics: [{ type: 'raw_data', id: '1' }],
                    timeField: datasource.timeField,
                    bucketAggs: [
                      {
                        id: '2',
                        type: 'date_histogram',
                        field: datasource.timeField,
                      },
                    ],
                  },
                  context
                )
                .loadItems(async () => {
                  const mappings = await datasource.getMappings(indexName);
                  const properties = mappings[indexName]?.mappings.properties;
                  return Object.keys(properties).map((propertyName) =>
                    new DataCatalogueBuilder(propertyName, 'Field').addKeyValue('type', properties[propertyName].type)
                  );
                })
            );
          }),
      ]);
  };

  const configuration = (item: DataCatalogueBuilder) => {
    item.setItems([
      new DataCatalogueBuilder('Settings')
        .addKeyValue('ES version', datasource.esVersion)
        .addKeyValue('Time field', datasource.timeField)
        .addKeyValue('Log message field', datasource.logMessageField || 'not set')
        .addKeyValue('Log level field', datasource.logLevelField || 'not set')
        .addKeyValue('XPack', datasource.xpack ? 'yes' : 'no'),
      new DataCatalogueBuilder('Features').loadItems(async () => {
        return Object.keys(features).map((featureName) => {
          return new DataCatalogueBuilder(featureName, 'Feature')
            .addKeyValue('available', features[featureName].available ? 'yes' : 'no')
            .addKeyValue('enabled', features[featureName].enabled ? 'yes' : 'no');
        });
      }),
    ]);
  };

  const statistics = (item: DataCatalogueBuilder) => {
    item
      .addKeyValue('Docs', stats._all.total.docs.count)
      .addKeyValue('Field data memory', stats._all.total.fielddata.memory_size_in_bytes + 'B')
      .addKeyValue('Shards', stats._all.total.shard_stats.total_count);
  };

  const status = async (item: DataCatalogueBuilder) => {
    item.addKeyValue('License', license.status);
    item.addKeyValue('Build data', build.date);
  };

  return new DataCatalogueBuilder().fromDataSource(datasource, context, {
    data,
    configuration,
    statistics,
    status,
  });
};
