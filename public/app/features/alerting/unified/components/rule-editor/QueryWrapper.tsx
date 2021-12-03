import React, { FC, useState } from 'react';
import { css } from '@emotion/css';
import { cloneDeep } from 'lodash';
import {
  CoreApp,
  DataQuery,
  DataSourceInstanceSettings,
  getDefaultRelativeTimeRange,
  GrafanaTheme2,
  LoadingState,
  PanelData,
  RelativeTimeRange,
  ThresholdsConfig,
} from '@grafana/data';
import { RelativeTimeRangePicker, useStyles2 } from '@grafana/ui';
import { QueryEditorRow } from 'app/features/query/components/QueryEditorRow';
import { VizWrapper } from './VizWrapper';
import { QueryOptions } from './QueryOptions';
import { isExpressionQuery } from 'app/features/expressions/guards';
import { TABLE, TIMESERIES } from '../../utils/constants';
import { SupportedPanelPlugins } from '../PanelPluginsButtonGroup';
import { AlertQuery } from 'app/types/unified-alerting-dto';

interface Props {
  data: PanelData;
  query: AlertQuery;
  queries: AlertQuery[];
  dsSettings: DataSourceInstanceSettings;
  onChangeDataSource: (settings: DataSourceInstanceSettings, index: number) => void;
  onChangeQuery: (query: DataQuery, index: number) => void;
  onRemoveQuery: (query: DataQuery) => void;
  onDuplicateQuery: (query: AlertQuery) => void;
  onRunQueries: () => void;
  onQueriesChange: (queries: AlertQuery[]) => void;
  index: number;
  thresholds: ThresholdsConfig;
  onChangeThreshold: (thresholds: ThresholdsConfig, index: number) => void;
}

export const QueryWrapper: FC<Props> = ({
  data,
  dsSettings,
  index,
  onChangeDataSource,
  onChangeQuery,
  onRunQueries,
  onRemoveQuery,
  onDuplicateQuery,
  onQueriesChange,
  query,
  queries,
  thresholds,
  onChangeThreshold,
}) => {
  const styles = useStyles2(getStyles);
  const isExpression = isExpressionQuery(query.model);
  const [pluginId, changePluginId] = useState<SupportedPanelPlugins>(isExpression ? TABLE : TIMESERIES);

  const onChangeTimeRange = (timeRange: RelativeTimeRange, index: number) => {
    onQueriesChange(
      queries.map((item, itemIndex) => {
        if (itemIndex !== index) {
          return item;
        }
        return {
          ...item,
          relativeTimeRange: timeRange,
        };
      })
    );
  };

  const renderHeaderExtras = () => {
    if (isExpressionQuery(query.model)) {
      return null;
    }

    return (
      <div className={styles.headerExtras}>
        <RelativeTimeRangePicker
          timeRange={query.relativeTimeRange ?? getDefaultRelativeTimeRange()}
          onChange={(range) => onChangeTimeRange(range, index)}
        />
        <QueryOptions onQueriesChange={onQueriesChange} queries={queries} index={index} />
      </div>
    );
  };

  return (
    <div className={styles.wrapper}>
      <QueryEditorRow<DataQuery>
        dataSource={dsSettings}
        onChangeDataSource={!isExpression ? (settings) => onChangeDataSource(settings, index) : undefined}
        id={query.refId}
        index={index}
        key={query.refId}
        data={data}
        query={cloneDeep(query.model)}
        onChange={(query) => onChangeQuery(query, index)}
        onRemoveQuery={onRemoveQuery}
        onAddQuery={() => onDuplicateQuery(cloneDeep(query))}
        onRunQuery={onRunQueries}
        queries={queries}
        renderHeaderExtras={renderHeaderExtras}
        app={CoreApp.UnifiedAlerting}
        visualization={
          data.state !== LoadingState.NotStarted ? (
            <VizWrapper
              data={data}
              changePanel={changePluginId}
              currentPanel={pluginId}
              thresholds={thresholds}
              onThresholdsChange={(thresholds) => onChangeThreshold(thresholds, index)}
            />
          ) : null
        }
        hideDisableQuery={true}
      />
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    label: AlertingQueryWrapper;
    margin-bottom: ${theme.spacing(1)};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius(1)};
    padding-bottom: ${theme.spacing(1)};
  `,
  headerExtras: css`
    display: flex;
    align-items: center;
    cursor: pointer;
  `,
});
