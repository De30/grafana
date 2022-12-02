import { lastValueFrom, map, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { DataCatalogueFolder, DataCatalogueFolderBuilder, DataCatalogueItemBuilder } from '@grafana/data';

import { ElasticDatasource } from './datasource';

type Deps = {
  datasource: ElasticDatasource;
};

export const getRootDataCatalogueFolder = async (deps: Deps): Promise<DataCatalogueFolder> => {
  return new DataCatalogueFolderBuilder(deps.datasource.name).setItems([
    new DataCatalogueFolderBuilder('Indices').loadItems(async () => {
      let indexList = deps.datasource.indexPattern.getIndexList();
      return indexList.map((indexName: string) =>
        new DataCatalogueFolderBuilder(indexName).loadItems(async () => {
          return lastValueFrom(
            deps.datasource.request('GET', `${indexName}/_mapping`).pipe(
              map((result) => {
                const properties = result[indexName]?.mappings.properties;
                return Object.keys(properties).map((propertyName) =>
                  new DataCatalogueItemBuilder(propertyName).addAttr('type', properties[propertyName].type)
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
              return new DataCatalogueItemBuilder(featureName)
                .addAttr('available', result.features[featureName].available)
                .addAttr('enabled', result.features[featureName].enabled);
            });
            return [];
          }),
          catchError(() => {
            return of([new DataCatalogueItemBuilder('No features found.')]);
          })
        )
      );
    }),
    new DataCatalogueFolderBuilder('Stats').loadItems(async () => {
      return lastValueFrom(
        deps.datasource.request('GET', '_stats').pipe(
          map((result) => {
            console.log(result);
            return [];
          })
        )
      );
    }),
  ]);
};
