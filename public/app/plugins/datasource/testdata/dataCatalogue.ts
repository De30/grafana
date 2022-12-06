import {
  DataCatalogueContext,
  DataCatalogueBuilder,
  isDataCatalogueContextWithQuery,
  DataCatalogueItem,
} from '@grafana/data';

import { TestDataDataSource } from './datasource';
import { TestDataQuery } from './types';

export const getRootDataCatalogueItem = async (
  context: DataCatalogueContext,
  datasource: TestDataDataSource
): Promise<DataCatalogueItem> => {
  const data = (item: DataCatalogueBuilder) => {
    item.setItems([
      new DataCatalogueBuilder('Metrics').setItems([
        new DataCatalogueBuilder('memory_total')
          .addKeyValue('docs', '200')
          .addIcon('question-circle', 'Total number of items in the metric'),
      ]),
      new DataCatalogueBuilder('Labels').setItems([
        new DataCatalogueBuilder('job').setItems([
          new DataCatalogueBuilder('load-balancer'),
          new DataCatalogueBuilder('application'),
          new DataCatalogueBuilder('database').addAction('run query', () => {
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
    ]);
  };

  const status = (item: DataCatalogueBuilder) => {
    item.setItems([
      new DataCatalogueBuilder('Info')
        .addKeyValue('version', '1.2')
        .addKeyValue('status', 'ok')
        .addKeyValue('date', '2022-11-30')
        .addKeyValue('hash', '12bf4a')
        .addIcon('check', 'The system is running okay.'),
    ]);
  };

  return new DataCatalogueBuilder().fromDataSource(datasource, context, { data, status });
};
