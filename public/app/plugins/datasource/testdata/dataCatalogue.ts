import { DataCatalogueFolder, DataCatalogueFolderBuilder, DataCatalogueItemBuilder } from '@grafana/data';

export const getRootDataCatalogueFolder = async (): Promise<DataCatalogueFolder> => {
  return new DataCatalogueFolderBuilder('root').setItems([
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
          new DataCatalogueItemBuilder('database').addAction('run query', () => {}),
        ]),
      ]),
    ]),
    new DataCatalogueFolderBuilder('Status').setItems([
      new DataCatalogueItemBuilder('')
        .addKeyValue('version', '1.2')
        .addIcon('health', 'check', 'The system is running okay.'),
    ]),
  ]);
};
