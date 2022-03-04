import React, { FC } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '../../themes';

interface Incident {
  title: string;
  description?: string;
  updates?: IncidentUpdate[];
  type?: IncidentType;
  startTime: Date;
  endTime?: Date;
}

enum IncidentType {
  Maintenance = 'maintenance',
  Degraded = 'degraded',
  Outage = 'outage',
}

interface IncidentUpdate {
  timestamp: Date;
  update: string;
}

export interface UptimeSummaryProps {
  incidents: Incident[];
}

const UptimeSummary: FC<UptimeSummaryProps> = ({ incidents = [] }) => {
  const styles = useStyles2(getStyles);

  if (incidents.length === 0) {
    return <div className={cx(styles.wrapper, styles.allOperational)}>All systems operational</div>;
  }

  return <div></div>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: flex;
    padding: ${theme.spacing(1)} ${theme.spacing(2)};
  `,
  allOperational: css`
    border: solid 1px green;
    background: green;
  `,
});

export { UptimeSummary };
