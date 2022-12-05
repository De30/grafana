import {
  DataCatalogueBuilder,
  DataCatalogueContext,
  DataCatalogueContextWithQuery,
  DataCatalogueItem,
  isDataCatalogueContextWithQuery,
} from '@grafana/data';

import { PrometheusDatasource } from './datasource';
import { PromQuery } from './types';

export const getRootDataCatalogueItem = async ({
  datasource,
  context,
}: {
  datasource: PrometheusDatasource;
  context: DataCatalogueContext;
}): Promise<DataCatalogueItem> => {
  const data = (item: DataCatalogueBuilder) => {
    item.setItems([
      new DataCatalogueBuilder('Metrics').loadItems(async () => {
        const result = await datasource.metadataRequest('/api/v1/metadata', {}, { showErrorAlert: false });
        const metrics = result.data?.data || {};

        // Group by type
        return Object.keys(metrics).map((metricName: string) => {
          const metricItem = new DataCatalogueBuilder(metricName);
          metrics[metricName].forEach((metricInfo: { type: string; help: string }) => {
            const prefix = metrics[metricName].length > 1 ? metricInfo.type + ': ' : '';

            metricItem.addDescription(`${prefix}${metricInfo.help}`).addTag(metricInfo.type);
            if (metricInfo.type === 'summary') {
              metricItem.addDescription(
                `A summary with a base metric name of <basename> exposes multiple time series during a scrape: <basename>{quantile="<φ>"}, <basename>_sum and <basename>_count`
              );

              if (isDataCatalogueContextWithQuery<PromQuery>(context)) {
                metricItem
                  .addAction('Show aggregated data', createRunActionQuery(context, `sum(${metricName})`))
                  .addAction(
                    'Show sum series',
                    createRunActionQuery(context, `rate(${metricName}_sum[$__rate_interval])`)
                  )
                  .addAction(
                    'Show counter',
                    createRunActionQuery(context, `rate(${metricName}_count[$__rate_interval])`)
                  );
              }
            } else {
              if (isDataCatalogueContextWithQuery<PromQuery>(context)) {
                metricItem.addAction('Show data', createRunActionQuery(context, `${metricName}`));
              }
            }
          });
          return metricItem;
        });
      }),
      new DataCatalogueBuilder('Labels').loadItems(async () => {
        const labels = await datasource.getTagKeys();
        return labels.map(({ text: labelName }: { text: string }) => {
          return new DataCatalogueBuilder(labelName).loadItems(async () => {
            const values = await datasource.getTagValues({ key: labelName });
            return values.map(({ text: value }: { text: string }) => {
              return new DataCatalogueBuilder(value);
            });
          });
        });
      }),
    ]);
  };

  const status = (item: DataCatalogueBuilder) => {
    item.loadItems(async () => {
      const flags = await datasource.metadataRequest('/api/v1/status/flags', {}, { showErrorAlert: false });
      const buildInfo = await datasource.metadataRequest('/api/v1/status/buildinfo', {}, { showErrorAlert: false });

      const flagsItem = new DataCatalogueBuilder('Flags');
      const flagsData = flags.data?.data || {};
      Object.keys(flagsData).forEach((flagName) => {
        flagsItem.addKeyValue(flagName, flagsData[flagName]);
      });

      const buildInfoData = buildInfo.data?.data || {};
      const buildInfoItem = new DataCatalogueBuilder('Build info')
        .addKeyValue('version', buildInfoData.version)
        .addKeyValue('go version', buildInfoData.goVersion);

      return [flagsItem, buildInfoItem];
    });
  };

  const configuration = (item: DataCatalogueBuilder) => {
    item.loadItems(async () => {
      const result = await datasource.metadataRequest('/api/v1/rules', {}, { showErrorAlert: false });
      const groups = result.data?.data?.groups;
      if (!groups || groups.length === 0) {
        return [new DataCatalogueBuilder('No rules found.')];
      } else {
        return [new DataCatalogueBuilder(`${groups.length} rules found`)];
      }
    });
  };

  return new DataCatalogueBuilder().fromDataSource(datasource, {
    data,
    configuration,
    status,
  });
};

const createRunActionQuery = (context: DataCatalogueContextWithQuery<PromQuery>, expr: string) => {
  return () => {
    context.changeQuery({
      refId: context.queryRefId,
      expr,
    });
    context.runQuery();
    context.closeDataCatalogue();
  };
};
