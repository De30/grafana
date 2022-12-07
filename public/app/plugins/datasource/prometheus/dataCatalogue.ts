import { DataCatalogueBuilder, DataCatalogueContext, DataCatalogueItemAttributeKeyValueFormat } from '@grafana/data';

import { PrometheusDatasource } from './datasource';
import { PromQuery } from './types';

export const getDataCatalogueCategories = ({
  datasource,
  context,
}: {
  datasource: PrometheusDatasource;
  context: DataCatalogueContext;
}) => {
  const data = (item: DataCatalogueBuilder) => {
    item
      .addDescription(
        'Prometheus fundamentally stores all data as time series: streams of timestamped values belonging to the same metric and the same set of labeled dimensions. Besides stored time series, Prometheus may generate temporary derived time series as the result of queries.'
      )
      .addLink('https://prometheus.io/docs/concepts/data_model/', 'Read more about Prometheus data model')

      .setItems([
        new DataCatalogueBuilder('Metrics')

          .addDescription(
            'Every time series is uniquely identified by its metric name and optional key-value pairs called labels.'
          )
          .addLink('https://prometheus.io/docs/concepts/data_model/', 'Read more about Prometheus data model')
          .loadItems(async () => {
            const result = await datasource.metadataRequest('/api/v1/metadata', {}, { showErrorAlert: false });
            const metrics = result.data?.data || {};

            // Group by type
            return Object.keys(metrics).map((metricName: string) => {
              const metricItem = new DataCatalogueBuilder(metricName, 'Metric');
              metrics[metricName].forEach((metricInfo: { type: string; help: string }) => {
                const prefix = metrics[metricName].length > 1 ? metricInfo.type + ': ' : '';

                metricItem.addDescription(`${prefix}${metricInfo.help}`).addTag(metricInfo.type);

                if (metricInfo.type === 'histogram') {
                  metricItem.addDescription(
                    'A histogram samples observations (usually things like request durations or response sizes) and counts them in configurable buckets. It also provides a sum of all observed values.'
                  );
                  metricItem.addLink(
                    'https://prometheus.io/docs/concepts/metric_types/#histogram',
                    'Learn more about Prometheus histograms'
                  );
                  metricItem.addKeyValue(
                    'Bucket',
                    metricName + '_bucket{le="<bound>"',
                    DataCatalogueItemAttributeKeyValueFormat.Code
                  );
                  metricItem.addKeyValue(
                    'Counter',
                    metricName + '_count',
                    DataCatalogueItemAttributeKeyValueFormat.Code
                  );
                  metricItem.addKeyValue(
                    'Total sum',
                    metricName + '_sum',
                    DataCatalogueItemAttributeKeyValueFormat.Code
                  );
                }

                metricItem.loadItems(async () => {
                  let adjustedMetricName = metricName;
                  if (metricInfo.type === 'histogram') {
                    adjustedMetricName = metricName + '_sum';
                  }
                  const result = await datasource.metadataRequest(
                    `/api/v1/series?match[]=${adjustedMetricName}{}`,
                    {},
                    { showErrorAlert: false }
                  );
                  const streams = result.data?.data || [];
                  const labels: Record<string, Record<string, string>> = {};
                  streams.forEach((stream: Record<string, string>) => {
                    Object.keys(stream)
                      .filter((name) => name !== '__name__')
                      .forEach((labelName) => {
                        labels[labelName] = labels[labelName] || {};
                        labels[labelName][stream[labelName]] = stream[labelName];
                      });
                  });
                  return Object.keys(labels).map((labelName) =>
                    new DataCatalogueBuilder(labelName, `${metricName}`)
                      .addKeyValue('Total values', Object.keys(labels[labelName]).length.toString())
                      .addDescription('Select label value from the left.')
                      .setItems(
                        Object.keys(labels[labelName]).map((labelValue) =>
                          new DataCatalogueBuilder(labelValue, `${metricName} / ${labelName}`)
                            .addKeyValue('Metric', metricName)
                            .addKeyValue('Info', metricInfo.help)
                            .addKeyValue('Label', labelName)
                            .addKeyValue('Label value', labelValue)
                            .addRunQueryAction<Omit<PromQuery, 'refId'>>(
                              'Show rate of events for this metric and label',
                              { expr: `rate(${metricName}_count{${labelName}="${labelValue}"}[$__rate_interval])` },
                              context
                            )
                        )
                      )
                  );
                });
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

  return {
    data,
    configuration,
    status,
  };
};
