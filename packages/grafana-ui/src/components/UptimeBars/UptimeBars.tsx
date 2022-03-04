import React, { FC } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '../../themes';
import { Tooltip } from '../Tooltip/Tooltip';
// import { last } from 'lodash';

export enum UptimeStatus {
  Operational = 'operational',
  Degraded = 'degraded',
  Outage = 'outage',
}

interface UptimeTimeSpan {
  hours: number;
  minutes: number;
}

export interface UptimeDailyStatus {
  date: Date;
  status: UptimeStatus;
  timespan?: UptimeTimeSpan;
}

export interface UptimeBarsProps {
  componentName: string;
  availability: number;
  dailyStatuses: UptimeDailyStatus[];
}

export const UptimeBars: FC<UptimeBarsProps> = ({ dailyStatuses, componentName, availability }) => {
  const styles = useStyles2(getUptimeBarsStyles);
  // const lastStatus = last(dailyStatuses);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.headerContainer}>
        <span className={styles.componentName}>{componentName}</span>
        <span>{availability * 100.0}% uptime</span>
      </div>
      <div className={styles.barsContainer}>
        {dailyStatuses.map((status, index) => (
          <UptimeBar key={index} status={status} />
        ))}
      </div>
    </div>
  );
};

const getUptimeBarsStyles = (theme: GrafanaTheme2) => ({
  mainContainer: css`
    display: flex;
    flex-direction: column;
    row-gap: ${theme.spacing(2)};
  `,
  headerContainer: css`
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    column-gap: ${theme.spacing(2)};
  `,
  barsContainer: css`
    display: flex;
    flex-direction: row;
    column-gap: ${theme.spacing(0.25)};
  `,
  componentName: css`
    font-weight: ${theme.typography.fontWeightBold};
  `,
});

interface UptimeBarProps {
  status: UptimeDailyStatus;
}

const UptimeBar: FC<UptimeBarProps> = ({ status: dailyStatus }) => {
  const styles = useStyles2(getUptimeBarStyles);

  const tooltipContent = (
    <div>
      <div>
        {dailyStatus.status}{' '}
        {dailyStatus.timespan && `for ${dailyStatus.timespan.hours} hours ${dailyStatus.timespan.minutes} minutes`}
      </div>
      <div>{dailyStatus.date.toLocaleDateString()}</div>
    </div>
  );

  return (
    <Tooltip content={tooltipContent} placement="top">
      <div className={cx(styles.bar, styles[dailyStatus.status])}></div>
    </Tooltip>
  );
};

const getUptimeBarStyles = (theme: GrafanaTheme2) => ({
  bar: css`
    width: 7px;
    height: 40px;
    background-color: ${theme.colors.success.main};
    border-radius: ${theme.shape.borderRadius(2)};
  `,
  [UptimeStatus.Operational]: css`
    background-color: ${theme.colors.success.main};
  `,
  [UptimeStatus.Degraded]: css`
    background-color: ${theme.colors.warning.main};
  `,
  [UptimeStatus.Outage]: css`
    background-color: ${theme.colors.error.main};
  `,
});
