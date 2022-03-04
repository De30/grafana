import React, { FC } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '../../themes';
import { Icon } from '../Icon/Icon';

export interface Incident {
  title: string;
  description?: string;
  updates?: IncidentUpdate[];
  type: IncidentType;
  startTime: Date;
  endTime?: Date;
}

export enum IncidentType {
  Maintenance = 'maintenance',
  Degraded = 'degraded',
  Outage = 'outage',
}

interface IncidentUpdate {
  timestamp: Date;
  type: UpdateType;
  update: string;
}

enum UpdateType {
  Investigating = 'investigating',
  Monitoring = 'monitoring',
  Update = 'update',
  Resolved = 'resolved',
}

export interface UptimeSummaryProps {
  incidents: Incident[];
}

const UptimeSummary: FC<UptimeSummaryProps> = ({ incidents = [] }) => {
  const styles = useStyles2(getStyles);
  const hasIncidents = incidents.length > 0;

  if (!hasIncidents) {
    return (
      <div className={styles.wrapper}>
        <Header title="All systems operational" />
      </div>
    );
  }

  return (
    <>
      {incidents.map((incident, index) => (
        <div key={index} className={styles.wrapper}>
          <Header title={incident.title} type={incident.type} />
          <Summary type={incident.type} description={incident.description} />
        </div>
      ))}
    </>
  );
};

interface HeaderProps {
  type?: IncidentType;
  title: string;
}

const Header: FC<HeaderProps> = ({ type, title }) => {
  const styles = useStyles2(getStyles);

  if (type === IncidentType.Maintenance) {
    return (
      <div className={cx(styles.header.wrapper, styles.header.maintenance)}>
        <Icon name="cog" /> {title}
      </div>
    );
  }

  if (type === IncidentType.Degraded) {
    return (
      <div className={cx(styles.header.wrapper, styles.header.degraded)}>
        <Icon name="exclamation-triangle" /> {title}
      </div>
    );
  }

  if (type === IncidentType.Outage) {
    return (
      <div className={cx(styles.header.wrapper, styles.header.outage)}>
        <Icon name="fire" /> {title}
      </div>
    );
  }

  return (
    <div className={cx(styles.header.wrapper, styles.header.allOperational)}>
      <Icon name="check-circle" /> {title}
    </div>
  );
};

interface SummaryProps {
  type: IncidentType;
  description?: string;
}

const Summary: FC<SummaryProps> = ({ type = IncidentType.Degraded, description }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.summaryItems.wrapper, styles.summaryItems[type])}>
      <div>{description}</div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    min-width: 500px;
  `,
  header: {
    wrapper: css`
      padding: ${theme.spacing(1)} ${theme.spacing(2)};
    `,
    allOperational: css`
      border: solid 1px ${theme.colors.success.border};
      background: ${theme.colors.success.main};
    `,
    [IncidentType.Maintenance]: css`
      border: solid 1px ${theme.colors.info.border};
      background: ${theme.colors.info.main};
    `,
    [IncidentType.Degraded]: css`
      border: solid 1px ${theme.colors.warning.border};
      background: ${theme.colors.warning.main};
    `,
    [IncidentType.Outage]: css`
      border: solid 1px ${theme.colors.error.border};
      background: ${theme.colors.error.main};
    `,
  },
  summaryItems: {
    wrapper: css`
      padding: ${theme.spacing(1)} ${theme.spacing(2)};
    `,
    [IncidentType.Degraded]: css`
      border: solid 1px ${theme.colors.warning.border};
      border-top: none;
    `,
    [IncidentType.Outage]: css`
      border: solid 1px ${theme.colors.error.border};
      border-top: none;
    `,
    [IncidentType.Maintenance]: css`
      border: solid 1px ${theme.colors.info.border};
      border-top: none;
    `,
  },
});

export { UptimeSummary };
