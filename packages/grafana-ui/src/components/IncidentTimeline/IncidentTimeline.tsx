import React, { FC } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '../../themes';
import { IncidentUpdate } from '../../types/uptime';

export interface TimelineProps {
  className?: string;
  updates: IncidentUpdate[];
}

const IncidentTimeline: FC<TimelineProps> = ({ updates = [], className }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.wrapper, className)}>
      {updates.map((update) => (
        <div key={String(update.timestamp)}>
          <header className={styles.header}>
            <span className={styles.updateType}>{update.type}</span>&nbsp;&mdash;&nbsp;{update.update}
          </header>
          <small>{update.timestamp.toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  header: css`
    display: flex;
    align-items: center;
  `,
  updateType: css`
    font-weight: bold;
  `,
});

export { IncidentTimeline };
