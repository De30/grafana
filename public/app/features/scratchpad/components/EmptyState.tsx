import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, useStyles2 } from '@grafana/ui';
import React from 'react';

const getStyles = (theme: GrafanaTheme2) => ({
  root: css`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    padding: ${theme.spacing(2)};
  `,
  content: css`
    border: 1px dashed ${theme.colors.border.medium};
    border-radius: ${theme.shape.borderRadius(4)};
    padding: ${theme.spacing(2)};
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
  `,
  small: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    margin: 0;
  `,
});

export const EmptyState = () => {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <Badge color="blue" icon="rocket" text="Beta" />
        <p>Drop a query here to move it to your Scratchpad</p>
        <p className={styles.small}>
          ProTip: Hold <kbd>shift</kbd> while dropping to copy the original query instead.
        </p>
      </div>
    </div>
  );
};
