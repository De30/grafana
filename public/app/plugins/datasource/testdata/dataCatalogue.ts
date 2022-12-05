import {
  DataCatalogueContext,
  DataCatalogueDatasourceFolderBuilder,
  DataCatalogueFolder,
  DataCatalogueFolderBuilder,
  DataCatalogueItemBuilder,
  isDataCatalogueContextWithQuery,
} from '@grafana/data';

import { TestDataDataSource } from './datasource';
import { TestDataQuery } from './types';

export const getRootDataCatalogueFolder = async (
  context: DataCatalogueContext,
  datasource: TestDataDataSource
): Promise<DataCatalogueFolder> => {
  return new DataCatalogueDatasourceFolderBuilder(datasource).setItems([
    new DataCatalogueFolderBuilder('Data').setItems([
      new DataCatalogueFolderBuilder('Metrics').setItems([
        new DataCatalogueItemBuilder('memory_total')
          .addKeyValue('docs', '200')
          .addIcon('info', 'question-circle', 'Total number of items in the metric'),
      ]),
      new DataCatalogueFolderBuilder('Labels').setItems([
        new DataCatalogueFolderBuilder('job').setItems([
          new DataCatalogueItemBuilder('load-balancer'),
          new DataCatalogueItemBuilder('application'),
          new DataCatalogueItemBuilder('database').addAction('run query', () => {
            if (isDataCatalogueContextWithQuery<TestDataQuery>(context)) {
              context.closeDataCatalogue();
              context.changeQuery({
                refId: context.queryRefId,
                scenarioId: 'logs',
              });
              context.runQuery();
            }
          }),
        ]),
      ]),
    ]),
    new DataCatalogueFolderBuilder('Status').setItems([
      new DataCatalogueItemBuilder('Info')
        .addKeyValue('version', '1.2')
        .addKeyValue('status', 'ok')
        .addKeyValue('date', '2022-11-30')
        .addKeyValue('hash', '12bf4a')
        .addIcon('health', 'check', 'The system is running okay.'),
    ]),
  ]);
};
