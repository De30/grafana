import { lastValueFrom, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import {
  DataCatalogueContext,
  DataCatalogueDatasourceFolderBuilder,
  DataCatalogueFolder,
  DataCatalogueFolderBuilder,
  DataCatalogueItemBuilder,
  isDataCatalogueContextWithQuery,
} from '@grafana/data';

import { ElasticDatasource } from './datasource';
import { ElasticsearchQuery } from './types';

type Deps = {
  datasource: ElasticDatasource;
  context: DataCatalogueContext<ElasticsearchQuery>;
};

export const getRootDataCatalogueFolder = async (deps: Deps): Promise<DataCatalogueFolder> => {
  const stats = await lastValueFrom(deps.datasource.request('GET', '_stats'));
  const context = deps.context;

  return new DataCatalogueDatasourceFolderBuilder(deps.datasource).setItems([
    new DataCatalogueFolderBuilder('Indices').loadItems(async () => {
      let indexList = Object.keys(stats.indices);
      return indexList.map((indexName: string) =>
        new DataCatalogueFolderBuilder(indexName, 'Index')
          .addKeyValue('Health', stats.indices[indexName].health)
          .addKeyValue('Status', stats.indices[indexName].status)
          .addKeyValue('Docs', stats.indices[indexName].total.docs.count)
          .addAction('Show data for this index', () => {
            if (isDataCatalogueContextWithQuery(context)) {
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
                    new DataCatalogueItemBuilder(propertyName, 'Field').addKeyValue(
                      'type',
                      properties[propertyName].type
                    )
                  );
                }),
                catchError(() => {
                  return of([new DataCatalogueItemBuilder('No mappings found inside this index.')]);
                })
              )
            );
          })
      );
    }),
    new DataCatalogueFolderBuilder('Features').loadItems(async () => {
      return lastValueFrom(
        // TODO: request is private, logic should be moved to ds
        deps.datasource.request('GET', `_xpack`).pipe(
          map((result) => {
            return Object.keys(result.features).map((featureName) => {
              return new DataCatalogueItemBuilder(featureName, 'Feature')
                .addAttr('available', result.features[featureName].available ? 'yes' : 'no')
                .addAttr('enabled', result.features[featureName].enabled ? 'yes' : 'no');
            });
            return [];
          }),
          catchError(() => {
            return of([new DataCatalogueItemBuilder('No features found.')]);
          })
        )
      );
    }),
    new DataCatalogueItemBuilder('Stats')
      .addKeyValue('Docs', stats._all.total.docs.count)
      .addKeyValue('Field data memory', stats._all.total.fielddata.memory_size_in_bytes + 'B')
      .addKeyValue('Shards', stats._all.total.shard_stats.total_count),
  ]);
};
