import { lastValueFrom } from 'rxjs';

import {
  DataCatalogueDatasourceFolderBuilder,
  DataCatalogueFolder,
  DataCatalogueFolderBuilder,
  DataCatalogueItemBuilder,
} from '@grafana/data';

import { PrometheusDatasource } from './datasource';

type Deps = {
  datasource: PrometheusDatasource;
};

export const getRootDataCatalogueFolder = async (deps: Deps): Promise<DataCatalogueFolder> => {
  return new DataCatalogueDatasourceFolderBuilder(deps.datasource).setItems([
    new DataCatalogueFolderBuilder('Metrics').loadItems(async () => {
      const result = await deps.datasource.metadataRequest('/api/v1/metadata', {}, { showErrorAlert: false });
      const metrics = result.data?.data || {};

      // Group by type
      return Object.keys(metrics).map((metricName: string) => {
        const metricItem = new DataCatalogueItemBuilder(metricName);
        metrics[metricName].forEach((metricInfo) => {
          metricItem.addTag(metricInfo.type);
          const prefix = metrics[metricName].length > 1 ? metricInfo.type + ': ' : '';
          metricItem.addDescription(`${prefix}${metricInfo.help}`);
        });
        return metricItem;
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
    new DataCatalogueFolderBuilder('Status').loadItems(async () => {
      const flags = await deps.datasource.metadataRequest('/api/v1/status/flags', {}, { showErrorAlert: false });
      const buildInfo = await deps.datasource.metadataRequest(
        '/api/v1/status/buildinfo',
        {},
        { showErrorAlert: false }
      );

      const flagsItem = new DataCatalogueItemBuilder('Flags');
      const flagsData = flags.data?.data || {};
      Object.keys(flagsData).forEach((flagName) => {
        flagsItem.addKeyValue(flagName, flagsData[flagName]);
      });

      const buildInfoData = buildInfo.data?.data || {};
      const buildInfoItem = new DataCatalogueItemBuilder('Build info')
        .addKeyValue('version', buildInfoData.version)
        .addKeyValue('go version', buildInfoData.goVersion);

      return [flagsItem, buildInfoItem];
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
