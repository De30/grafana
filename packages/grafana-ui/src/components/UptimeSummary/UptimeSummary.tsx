import React, { FC } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '../../themes';
import { Icon } from '../Icon/Icon';

export interface Incident {
  title: string;
  description?: string;
  updates?: IncidentUpdate[];
  type?: IncidentType;
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
  update: string;
}

export interface UptimeSummaryProps {
  incidents: Incident[];
}

const UptimeSummary: FC<UptimeSummaryProps> = ({ incidents = [] }) => {
  const styles = useStyles2(getStyles);
  const hasIncidents = incidents.length > 0;
  const hasOutages = hasIncidents && incidents.some((incident) => incident.type === IncidentType.Outage);
  const hasDegraded = hasIncidents && incidents.some((incident) => incident.type === IncidentType.Degraded);
  const justMaintenance = hasIncidents && incidents.every((incident) => incident.type === IncidentType.Maintenance);

  // the most severe type in the incidents list chooses the entire summary type
  let summaryType: IncidentType | undefined = undefined;

  if (hasOutages) {
    summaryType = IncidentType.Outage;
  }

  if (hasDegraded) {
    summaryType = IncidentType.Degraded;
  }

  if (justMaintenance) {
    summaryType = IncidentType.Maintenance;
  }

  return (
    <div className={styles.wrapper}>
      {<Header type={summaryType} />}
      {hasIncidents && <SummaryItems incidents={incidents} type={summaryType} />}
    </div>
  );
};

interface HeaderProps {
  type?: IncidentType;
}

const Header: FC<HeaderProps> = ({ type }) => {
  const styles = useStyles2(getStyles);

  if (type === IncidentType.Maintenance) {
    return (
      <div className={cx(styles.header.wrapper, styles.header.maintenance)}>
        <Icon name="cog" /> Scheduled maintenance
      </div>
    );
  }

  if (type === IncidentType.Degraded) {
    return (
      <div className={cx(styles.header.wrapper, styles.header.degraded)}>
        <Icon name="exclamation-triangle" /> Degraded service
      </div>
    );
  }

  if (type === IncidentType.Outage) {
    return (
      <div className={cx(styles.header.wrapper, styles.header.outage)}>
        <Icon name="fire" /> Severe service impact
      </div>
    );
  }

  return (
    <div className={cx(styles.header.wrapper, styles.header.allOperational)}>
      <Icon name="check-circle" /> All systems operational
    </div>
  );
};

interface SummaryItemsProps {
  type?: IncidentType;
  incidents: Incident[];
}

const SummaryItems: FC<SummaryItemsProps> = ({ type = IncidentType.Degraded, incidents }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.summaryItems.wrapper, styles.summaryItems[type])}>
      {incidents.map((incident) => (
        <div key={incident.startTime.toString()}>
          <div>{incident.title}</div>
        </div>
      ))}
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
      color: black;
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
