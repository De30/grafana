import React from 'react';

import { DataCatalogueContext, DataCatalogueBuilder } from '@grafana/data';

import { FeatureList } from './FeatureList';
import { ElasticDatasource } from './datasource';
import { ElasticsearchQuery } from './types';

export const getDataCatalogueCategories = ({
  datasource,
  context,
}: {
  datasource: ElasticDatasource;
  context: DataCatalogueContext;
}) => {
  const data = (item: DataCatalogueBuilder) => {
    item
      .addDescription(
        'Elasticsearch is a distributed document store. Instead of storing information as rows of columnar data, Elasticsearch stores complex data structures that have been serialized as JSON documents. When you have multiple Elasticsearch nodes in a cluster, stored documents are distributed across the cluster and can be accessed immediately from any node.'
      )
      .addLink(
        'https://www.elastic.co/guide/en/elasticsearch/reference/current/documents-indices.html',
        'Learn more about Elasticserach data model'
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
            const stats = await datasource.getStats();
            let indexList = Object.keys(stats.indices);
            return indexList.map((indexName: string) =>
              new DataCatalogueBuilder(indexName, 'Index')
                .addKeyValue('Health', stats.indices[indexName].health)
                .addKeyValue('Status', stats.indices[indexName].status)
                .addKeyValue('Docs', stats.indices[indexName].total.docs.count)
                .addRunQueryAction<Omit<ElasticsearchQuery, 'refId'>>(
                  'Show documents in this index',
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
    item
      .addKeyValue('ES version', datasource.esVersion)
      .addKeyValue('Time field', datasource.timeField)
      .addKeyValue('Log message field', datasource.logMessageField || 'not set')
      .addKeyValue('Log level field', datasource.logLevelField || 'not set')
      .addKeyValue('XPack', datasource.xpack ? 'yes' : 'no')

      .setItems([
        new DataCatalogueBuilder('Features').loadAttributes(async (item) => {
          const { features } = await datasource.getMeta();
          item.addCustom(<FeatureList features={features} />);
        }),
      ]);
  };

  const statistics = (item: DataCatalogueBuilder) => {
    item.loadAttributes(async (item) => {
      const stats = await datasource.getStats();
      item
        .addKeyValue('Total documents', stats._all.total.docs.count)
        .addKeyValue('Store size', stats._all.total.store.size_in_bytes + 'B')
        .addKeyValue('Shards', stats._all.total.shard_stats.total_count);
    });
  };

  const status = async (item: DataCatalogueBuilder) => {
    const { license, build } = await datasource.getMeta();
    item.loadAttributes(async (item) => {
      item.addKeyValue('License', license.status);
      item.addKeyValue('Build data', build.date);
    });
  };

  return {
    data,
    configuration,
    statistics,
    status,
  };
};
