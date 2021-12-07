import React, { FC, FormEvent, useMemo, useState } from 'react';
import { css } from '@emotion/css';
import { DataSourceInstanceSettings, GrafanaTheme2 } from '@grafana/data';
import { Icon, InlineField, Input, useStyles2 } from '@grafana/ui';
import { AlertQuery } from 'app/types/unified-alerting-dto';

interface Props {
  onQueriesChange: (queries: AlertQuery[]) => void;
  queries: AlertQuery[];
  query: AlertQuery;
  index: number;
  dataSourceSettings: DataSourceInstanceSettings;
}

export const QueryOptions: FC<Props> = ({ dataSourceSettings, index, onQueriesChange, queries, query }) => {
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const styles = useStyles2(getStyles);
  const minInterval = useMemo(() => {
    return dataSourceSettings.meta?.queryOptions?.minInterval;
  }, [dataSourceSettings]);
  const maxDataPoints = useMemo(() => {
    return dataSourceSettings.meta?.queryOptions?.maxDataPoints;
  }, [dataSourceSettings]);

  const onChangeMinInterval = (event: FormEvent<HTMLInputElement>) => {
    const minInterval = parseFloat(event.currentTarget.value);

    if (minInterval === -1) {
      onQueriesChange(
        queries.map((item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }
          return {
            ...item,
            model: {
              ...item.model,
              minInterval,
            },
          };
        })
      );
    }
  };

  const onChangeMaxDataPoints = (event: FormEvent<HTMLInputElement>) => {
    const maxDataPoints = parseFloat(event.currentTarget.value);

    if (maxDataPoints === -1) {
      onQueriesChange(
        queries.map((item, itemIndex) => {
          if (itemIndex !== index) {
            return item;
          }
          return {
            ...item,
            model: {
              ...item.model,
              maxDataPoints,
            },
          };
        })
      );
    }
  };

  return (
    <div className={styles.queryOptions}>
      <div onClick={() => setOptionsOpen(!optionsOpen)} className={styles.label}>
        <span>Query options</span> <Icon name={optionsOpen ? 'angle-left' : 'angle-right'} />
      </div>
      {optionsOpen ? (
        <>
          <InlineField
            className={styles.inlineFieldOverride}
            label="Min interval"
            tooltip={
              <>
                A lower limit for the interval. Recommended to be set to write frequency, for example <code>1m</code> if
                your data is written every minute. Default value can be set in data source settings for most data
                sources.
              </>
            }
          >
            <Input
              onChange={onChangeMinInterval}
              placeholder="15s"
              width={10}
              default={minInterval}
              value={query.model.intervalMs}
            />
          </InlineField>
          <InlineField
            className={styles.inlineFieldOverride}
            label="Max data points"
            tooltip={
              <>
                The maximum data points per series. Used directly by some data sources and used in calculation of auto
                interval. With streaming data this value is used for the rolling buffer.
              </>
            }
          >
            <Input
              onChange={onChangeMaxDataPoints}
              width={10}
              default={maxDataPoints}
              value={query.model.maxDataPoints}
            />
          </InlineField>
        </>
      ) : null}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => {
  return {
    queryOptions: css`
      display: flex;
      align-items: center;
      margin-left: ${theme.spacing(1)};
    `,
    label: css`
      color: ${theme.colors.text.link};
      font-weight: ${theme.typography.fontWeightMedium};
    `,
    inlineFieldOverride: css`
      margin: 0;
    `,
  };
};
