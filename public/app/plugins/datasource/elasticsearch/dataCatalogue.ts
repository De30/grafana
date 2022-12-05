import { lastValueFrom, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DataCatalogueContext, DataCatalogueBuilder, isDataCatalogueContextWithQuery } from '@grafana/data';

import { ElasticDatasource } from './datasource';
import { ElasticsearchQuery } from './types';

type Deps = {
  datasource: ElasticDatasource;
  context: DataCatalogueContext;
};

export const getRootDataCatalogueItem = async (deps: Deps) => {
  const stats = await lastValueFrom(deps.datasource.request('GET', '_stats'));
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
            return lastValueFrom(
              deps.datasource.request('GET', `${indexName}/_mapping`).pipe(
                map((result) => {
                  const properties = result[indexName]?.mappings.properties;
                  return Object.keys(properties).map((propertyName) =>
                    new DataCatalogueBuilder(propertyName, 'Field').addKeyValue('type', properties[propertyName].type)
                  );
                }),
                catchError(() => {
                  return of([new DataCatalogueBuilder('No mappings found inside this index.')]);
                })
              )
            );
          })
      );
    }),
    new DataCatalogueBuilder('Features').loadItems(async () => {
      return lastValueFrom(
        // TODO: request is private, logic should be moved to ds
        deps.datasource.request('GET', `_xpack`).pipe(
          map((result) => {
            return Object.keys(result.features).map((featureName) => {
              return new DataCatalogueBuilder(featureName, 'Feature')
                .addAttr('available', result.features[featureName].available ? 'yes' : 'no')
                .addAttr('enabled', result.features[featureName].enabled ? 'yes' : 'no');
            });
            return [];
          }),
          catchError(() => {
            return of([new DataCatalogueBuilder('No features found.')]);
          })
        )
      );
    }),
    new DataCatalogueBuilder('Stats')
      .addKeyValue('Docs', stats._all.total.docs.count)
      .addKeyValue('Field data memory', stats._all.total.fielddata.memory_size_in_bytes + 'B')
      .addKeyValue('Shards', stats._all.total.shard_stats.total_count),
  ]);
};
