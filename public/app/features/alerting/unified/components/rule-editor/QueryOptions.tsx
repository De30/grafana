import React, { FC, FormEvent, useState } from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, InlineField, Input, useStyles2 } from '@grafana/ui';
import { AlertQuery } from 'app/types/unified-alerting-dto';

interface Props {
  onQueriesChange: (queries: AlertQuery[]) => void;
  queries: AlertQuery[];
  index: number;
}

export let QueryOptions: FC<Props> = ({ onQueriesChange, queries, index }) => {
  const [optionsOpen, setOptionsOpen] = useState<boolean>(false);
  const styles = useStyles2(getStyles);

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
      <div onClick={() => setOptionsOpen(!optionsOpen)}>
        Query options <Icon name={optionsOpen ? 'angle-left' : 'angle-right'} />
      </div>
      {optionsOpen ? (
        <>
          <InlineField
            label="Min interval"
            tooltip={
              <>
                A lower limit for the interval. Recommended to be set to write frequency, for example <code>1m</code> if
                your data is written every minute. Default value can be set in data source settings for most data
                sources.
              </>
            }
          >
            <Input onChange={onChangeMinInterval} placeholder="15s" />
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
            <Input onChange={onChangeMaxDataPoints} />
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
      margin-left: ${theme.spacing(1)};
    `,
  };
};
