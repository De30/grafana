import { css, cx } from '@emotion/css';
import React, { ReactNode } from 'react';
import { useMeasure } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, clearButtonStyles, Icon, HorizontalGroup } from '@grafana/ui';

const getStyles = (theme: GrafanaTheme2) => ({
  root: css`
    label: PanelContainer;
    margin-bottom: ${theme.spacing(1)};
    background-color: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.medium};
    position: relative;
    border-radius: 3px;
    width: 100%;
    display: flex;
    flex-direction: column;
  `,
  collapseBody: css`
    label: PanelContainer-body;
    padding: ${theme.spacing(theme.components.panel.padding)};
    padding-top: 0;
    overflow: hidden;
  `,
  label: css`
    padding: ${theme.spacing(1, 2, 1, 2)};
    display: flex;
<<<<<<< HEAD
    flex-grow: 1;
    transition: all 0.1s linear;
=======
>>>>>>> 6064342b08 (add primary actions to PanelContainer)
  `,
  headerLabel: css`
    font-weight: ${theme.typography.fontWeightMedium};
    font-size: ${theme.typography.fontSize}px;
  `,
  icon: css`
    margin: ${theme.spacing(0.25, 1, 0, -1)};
  `,
  header: css`
    display: flex;
    justify-content: space-between;
  `,
  left: css`
    display: flex;
  `,
  secondaryActions: css`
    margin-right: ${theme.spacing(1)};
  `,
});

export interface Props {
  /** Expand or collapse the content */
  isOpen?: boolean;
  /**  text for the Collapse header */
  label: string;
  /** Toggle collapsed header icon */
  collapsible?: boolean;
  /** Callback for the toggle functionality */
  onToggle?: (isOpen: boolean) => void;

  primaryActions?: ReactNode;
  secondaryActions?: ReactNode;

  children?: ReactNode | ((width: number) => ReactNode);

  // TODO: display loader when panel is loading
  loading?: boolean;
}

export function PanelContainer({
  isOpen,
  label,
  collapsible,
  onToggle,
  children,
  secondaryActions,
  primaryActions,
}: Props) {
  const buttonStyles = useStyles2(clearButtonStyles);
  const styles = useStyles2(getStyles);
  const [ref, { width }] = useMeasure<HTMLDivElement>();

  return (
    <>
      <div className={styles.root}>
        <div className={styles.header}>
          <div className={styles.left}>
            {collapsible ? (
              <button
                // FIXME: this misses proper aria stuff for expanding content
                type="button"
                className={cx(buttonStyles, styles.label)}
                onClick={() => onToggle?.(!isOpen)}
              >
                <Icon className={styles.icon} name={isOpen ? 'angle-down' : 'angle-right'} />
                <div className={cx([styles.headerLabel])}>{label}</div>
              </button>
            ) : (
              <div className={styles.label}>
                <div className={cx([styles.headerLabel])}>{label}</div>
              </div>
            )}
            {primaryActions && (
              <HorizontalGroup spacing="sm" justify="flex-start" align="center">
                {primaryActions}
              </HorizontalGroup>
            )}
          </div>
          {secondaryActions && (
            <div className={styles.secondaryActions}>
              <HorizontalGroup spacing="sm" justify="flex-end" align="center">
                {secondaryActions}
              </HorizontalGroup>
            </div>
          )}
        </div>
        {isOpen && (
          <div className={styles.collapseBody} ref={ref}>
            {typeof children === 'function' ? children(width) : children}
          </div>
        )}
      </div>
      {isOpen && (
        <div className={styles.collapseBody} ref={ref}>
          {typeof children === 'function' ? children(width) : children}
        </div>
      )}
    </>
  );
}
