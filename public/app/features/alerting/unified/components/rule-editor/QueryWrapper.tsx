import React, { FC, ReactNode, useState } from 'react';
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
import { Icon, InlineField, Input, RelativeTimeRangePicker, useStyles2 } from '@grafana/ui';
import { QueryEditorRow } from 'app/features/query/components/QueryEditorRow';
import { VizWrapper } from './VizWrapper';
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
  onChangeTimeRange?: (timeRange: RelativeTimeRange, index: number) => void;
  onRemoveQuery: (query: DataQuery) => void;
  onDuplicateQuery: (query: AlertQuery) => void;
  onRunQueries: () => void;
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
  onChangeTimeRange,
  onRunQueries,
  onRemoveQuery,
  onDuplicateQuery,
  query,
  queries,
  thresholds,
  onChangeThreshold,
}) => {
  const styles = useStyles2(getStyles);
  const isExpression = isExpressionQuery(query.model);
  const [pluginId, changePluginId] = useState<SupportedPanelPlugins>(isExpression ? TABLE : TIMESERIES);
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);

  const renderTimePicker = (): ReactNode => {
    if (isExpressionQuery(query.model) || !onChangeTimeRange) {
      return null;
    }

    return (
      <RelativeTimeRangePicker
        timeRange={query.relativeTimeRange ?? getDefaultRelativeTimeRange()}
        onChange={(range) => onChangeTimeRange(range, index)}
      />
    );
  };

  const renderQueryOptions = () => {
    return (
      <div className={styles.queryOptions}>
        <div onClick={() => setOptionsOpen(!optionsOpen)}>
          Query options <Icon name={optionsOpen ? 'angle-left' : 'angle-right'} />
        </div>
        {optionsOpen ? (
          <>
            <InlineField
              label="Min interval"
              tooltip={
                <>
                  A lower limit for the interval. Recommended to be set to write frequency, for example <code>1m</code>{' '}
                  if your data is written every minute. Default value can be set in data source settings for most data
                  sources.
                </>
              }
            >
              <Input placeholder="15s" />
            </InlineField>
            <InlineField
              label="Max data points"
              tooltip={
                <>
                  The maximum data points per series. Used directly by some data sources and used in calculation of auto
                  interval. With streaming data this value is used for the rolling buffer.
                </>
              }
            >
              <Input />
            </InlineField>
          </>
        ) : null}
      </div>
    );
  };

  const renderHeaderExtras = () => {
    if (isExpressionQuery(query.model)) {
      return null;
    }

    return (
      <div className={styles.headerExtras}>
        {renderTimePicker()}
        {renderQueryOptions()}
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
  queryOptions: css`
    display: flex;
    margin-left: ${theme.spacing(1)};
  `,
  headerExtras: css`
    display: flex;
    align-items: center;
    cursor: pointer;
  `,
});
