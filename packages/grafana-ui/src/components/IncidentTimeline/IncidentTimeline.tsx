import React, { FC } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '../../themes';
import { IncidentUpdate, UpdateType } from '../../types/uptime';
import { Icon } from '../Icon/Icon';

export interface TimelineProps {
  className?: string;
  updates: IncidentUpdate[];
}

const IncidentTimeline: FC<TimelineProps> = ({ updates = [], className }) => {
  const styles = useStyles2(getStyles);

  return (
    <div className={cx(styles.wrapper, className)}>
      {updates.map((update) => (
        <div className={styles.item} key={String(update.timestamp)}>
          <TypeIcon type={update.type} />
          <div>
            <header className={styles.header}>
              <span className={styles.updateType}>{update.type}</span>&nbsp;&mdash;&nbsp;{update.update}
            </header>
            <small className={styles.timestamp}>{update.timestamp.toLocaleString()}</small>
          </div>
        </div>
      ))}
    </div>
  );
};

const TypeIcon: FC<{ type: UpdateType }> = ({ type }) => {
  const styles = useStyles2(getStyles);
  const isResolved = type === UpdateType.Resolved;

  return <div className={styles.icon}>{isResolved && <Icon name="check" />}</div>;
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css`
    display: flex;
    flex-direction: column;
    gap: ${theme.spacing(1)};
  `,
  item: css`
    position: relative;
    display: flex;
    flex-direction: row;
    gap: ${theme.spacing(1)};

    &:before {
      content: '';
      position: absolute;
      left: 10px;
      top: 20px;
      width: 1px;
      /* half height of the icon and size of the border */
      height: calc(100% - 11px);
      background: ${theme.colors.border.strong};
    }
    /* disable line for last item in the list */
    &:last-child:before {
      width: 0;
    }
  `,
  header: css`
    display: flex;
    align-items: center;
  `,
  updateType: css`
    font-weight: bold;
  `,
  icon: css`
    width: 20px;
    height: 20px;

    border: solid 1px ${theme.colors.border.strong};
    border-radius: 100%;

    display: flex;
    align-items: center;
    justify-content: center;
  `,
  timestamp: css`
    color: ${theme.colors.text.disabled};
  `,
});

export { IncidentTimeline };
