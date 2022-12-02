import { DataCatalogueFolder, DataCatalogueFolderBuilder, DataCatalogueItemBuilder } from '@grafana/data';

import { PrometheusDatasource } from './datasource';

type Deps = {
  datasource: PrometheusDatasource;
};

export const getRootDataCatalogueFolder = async (deps: Deps): Promise<DataCatalogueFolder> => {
  return new DataCatalogueFolderBuilder('prometheus').setItems([
    new DataCatalogueFolderBuilder('Metrics').loadItems(async () => {
      const result = await deps.datasource.metadataRequest('/api/v1/metadata', {}, { showErrorAlert: false });
      const metrics = result.data?.data || {};

      // Group by type
      return Object.keys(metrics).map((metricName: string) => {
        return new DataCatalogueItemBuilder(metricName).addAttr(
          'type',
          metrics[metricName].map((metricInfo: { type: string }) => metricInfo.type).join(',')
        );
      });
    }),
    new DataCatalogueFolderBuilder('Labels').loadItems(async () => {
      const labels = await deps.datasource.getTagKeys();
      return labels.map(({ text: labelName }: { text: string }) => {
        return new DataCatalogueFolderBuilder(labelName).loadItems(async () => {
          const values = await deps.datasource.getTagValues({ key: labelName });
          return values.map(({ text: value }: { text: string }) => {
            return new DataCatalogueItemBuilder(value);
          });
        });
      });
    }),
    new DataCatalogueFolderBuilder('Rules').loadItems(async () => {
      const result = await deps.datasource.metadataRequest('/api/v1/rules', {}, { showErrorAlert: false });
      const groups = result.data?.data?.groups;
      if (!groups || groups.length === 0) {
        return [new DataCatalogueItemBuilder('No rules found.')];
      } else {
        return [new DataCatalogueItemBuilder(`${groups.length} rules found`)];
      }
    }),
  ]);
};
