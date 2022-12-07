import React from 'react';

import {
  DataCatalogueBuilder,
  DataCatalogueContext,
  DataCatalogueItem,
  DataCatalogueItemAttributeKeyValueFormat,
  DataSourceApi,
  DataSourceInstanceSettings,
  isDataCatalogueContextExploreLinkBuilder,
} from '@grafana/data';
import { getBackendSrv } from '@grafana/runtime';

import { CorrelationData, fetchCorrelations } from '../../correlations/useCorrelations';

import { DataSourceCorrelationsGraph } from './DataSourceCorrelationsGraph';

export class DatasourceDataCatalogueBuilder extends DataCatalogueBuilder {
  constructor(
    datasource: DataSourceApi,
    context: DataCatalogueContext,
    categories: {
      data?: (item: DataCatalogueBuilder) => void;
      configuration?: (item: DataCatalogueBuilder) => void;
      status?: (item: DataCatalogueBuilder) => void;
      statistics?: (item: DataCatalogueBuilder) => void;
    } = { status: () => {} }
  ) {
    super(datasource.meta.name, 'Data source');
    this.addKeyValue('Name', datasource.meta.name);
    datasource.meta.category && this.addKeyValue('Category', datasource.meta.category);
    this.addKeyValue('Author', datasource.meta.info.author.name);
    this.addKeyValue('Alerting', datasource.meta.alerting ? 'supported' : 'not supported');
    this.addKeyValue('Annotations', datasource.meta.annotations ? 'supported' : 'not supported');
    this.addKeyValue('Streaming', datasource.meta.streaming ? 'supported' : 'not supported');
    this.addDescription(datasource.meta.info.description);

    (datasource.meta.info.links || []).forEach((link) => {
      this.addLink(link.url, link.name);
    });

    datasource.meta.info.version && this.addKeyValue('Version', datasource.meta.info.version);
    this.addImage(datasource.meta.info.logos.small);

    if (isDataCatalogueContextExploreLinkBuilder(context)) {
      const exploreUrl = context.createExploreUrl([]);
      this.addLink(exploreUrl, 'Open Grafana Explore');
    }

    if (datasource.meta.metrics) {
      this.addTag('metrics');
    }
    if (datasource.meta.logs) {
      this.addTag('logs');
    }
    if (datasource.meta.tracing) {
      this.addTag('traces');
    }

    const commonCategories = [];
    if (categories.data) {
      const dataCategory = new DataCatalogueBuilder('Data').addIcon('database', 'Available data sets');
      categories.data(dataCategory);
      commonCategories.push(dataCategory);
    }
    if (categories.configuration) {
      const configurationCategory = new DataCatalogueBuilder('Configuration').addIcon('cog', 'Current configuration');
      categories.configuration(configurationCategory);
      commonCategories.push(configurationCategory);
    }
    if (categories.status) {
      const statusCategory = new DataCatalogueBuilder('Runtime status')
        .addIcon('heart', 'Current status & health')
        .loadAttributes(async (item) => {
          let status;
          try {
            status = !!(await datasource.testDatasource());
          } catch (e) {
            status = false;
          }
          item.addKeyValue('Test check', status ? 'ok' : 'failed');
        });
      categories.status(statusCategory);
      commonCategories.push(statusCategory);
    }
    if (categories.statistics) {
      const statisticsCategory = new DataCatalogueBuilder('Statistics').addIcon(
        'chart-line',
        'Data statistics and summaries'
      );
      categories.statistics(statisticsCategory);
      commonCategories.push(statisticsCategory);
    }

    commonCategories.push(
      new DataCatalogueBuilder('Correlations').addIcon('gf-glue', 'Correlations').loadAttributes(async (item) => {
        const correlations = await fetchCorrelations(getBackendSrv());

        if (datasource.meta.metrics) {
          this.addTag('metrics');
        }
        if (datasource.meta.logs) {
          this.addTag('logs');
        }
        if (datasource.meta.tracing) {
          this.addTag('traces');
        }

        const connections: Record<
          string,
          { datasource: DataSourceInstanceSettings; from: boolean; to: boolean; correlations: CorrelationData[] }
        > = {};
        correlations.forEach((correlation) => {
          if (correlation.source.uid === datasource.uid || correlation.target.uid === datasource.uid) {
            const other = correlation.source.uid === datasource.uid ? correlation.target : correlation.source;
            if (!connections[other.uid]) {
              connections[other.uid] = { from: false, to: false, datasource: other, correlations: [] };
            }
            if (datasource.uid === correlation.source.uid) {
              connections[other.uid].from = true;
            } else {
              connections[other.uid].to = true;
            }
            connections[other.uid].correlations.push(correlation);
          }
        });

        const correlationItems: DataCatalogueItem[] = Object.values(connections).map((connection) => {
          return new DataCatalogueBuilder(connection.datasource.name, 'Correlated data source')
            .addKeyValue('Total correlations', connections[connection.datasource.uid].correlations.length.toString())
            .addDescription('Select correlation for more details')
            .setItems(
              connection.correlations.map((correlation) =>
                new DataCatalogueBuilder(correlation.label, 'Correlation')
                  .addDescription(correlation.description || '')
                  .addKeyValue('Source', correlation.source.name)
                  .addKeyValue('Type', correlation.config.type)
                  .addKeyValue('Field', correlation.config.field)
                  .addKeyValue('Target', correlation.target.name)
                  .addKeyValue(
                    'Query',
                    JSON.stringify(correlation.config.target, undefined, 2),
                    DataCatalogueItemAttributeKeyValueFormat.Code
                  )
              )
            );
        });
        item.setItems(correlationItems);
        item.addDescription(
          'Correlations are data links that allow to navigate through different data sources that contain correlated data.'
        );

        item.addCustom(
          <DataSourceCorrelationsGraph datasource={datasource} connections={Object.values(connections)} />
        );

        item.addLink('/datasources/correlations', 'Go to correlations settings page');
      })
    );

    this.setItems(commonCategories);

    return this;
  }
}
