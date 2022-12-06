import { DataCatalogueBuilder, DataCatalogueContext } from '@grafana/data';

import { TempoDatasource } from './datasource';

export const getRootDataCatalogueItem = async ({
  context,
  datasource,
}: {
  context: DataCatalogueContext;
  datasource: TempoDatasource;
}) => {
  const statistics = (item: DataCatalogueBuilder) => {
    item.loadAttributes(async (item) => {
      const metrics = await datasource.metadataRequest('/metrics');
      const raw = metrics.data;
      raw.split('\n').forEach((line: string) => {
        addAttribute(line, item, 'tempo_receiver_accepted_spans', 'Received spans');
        addAttribute(line, item, 'tempo_discarded_spans_total', 'Discarded spans');
        addAttribute(line, item, 'tempo_ingester_failed_flushes_total', 'Failed ingester flushes');
      });
    });
  };

  const status = (item: DataCatalogueBuilder) => {
    item.loadAttributes(async (item) => {
      const metrics = await datasource.metadataRequest('/metrics');
      const raw = metrics.data;
      raw.split('\n').forEach((line: string) => {
        addAttribute(
          line,
          item,
          'tempo_request_duration_seconds_bucket{method="GET",route="api_traces_traceid",status_code="200",ws="false",le="50"}',
          'Average request time (seconds)'
        );
      });
    });
  };

  return new DataCatalogueBuilder().fromDataSource(datasource, context, { statistics, status });
};

const addAttribute = (line: string, item: DataCatalogueBuilder, metricName: string, title: string) => {
  if (line.startsWith(metricName)) {
    const parts = line.split(' ');
    item.addKeyValue(title, parts[parts.length - 1]);
  }
};
