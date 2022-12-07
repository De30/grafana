import { css, cx } from '@emotion/css';
import { OverlayContainer, useOverlay } from '@react-aria/overlays';
import React, { ReactNode, useRef, useState } from 'react';
import CSSTransition from 'react-transition-group/CSSTransition';
import { useMeasure } from 'react-use';

import { GrafanaTheme2 } from '@grafana/data';
import { useStyles2, clearButtonStyles, Icon, HorizontalGroup, IconButton } from '@grafana/ui';

const ANIMATION_DURATION = 200;

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
  underlay: css`
    background-color: ${theme.components.overlay.background};
    backdrop-filter: blur(1px);
    bottom: 0;
    left: 0;
    padding: 0;
    position: fixed;
    right: 0;
    top: 0;
    z-index: ${theme.zIndex.modalBackdrop};
  `,
  overlay: css`
    label: overlay;
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.components.panel.borderColor};
    padding: ${theme.spacing(1)};
    height: 96vh;
    width: 95%;
    right: 0;
    top: 0;
    left: 0;
    bottom: 0;
    margin: ${theme.spacing(2)} auto;
    padding: ${theme.spacing(1)};
    position: fixed;
    z-index: ${theme.zIndex.modal};
    overflow: auto;
    display: flex;
    flex-direction: column;

    ${theme.breakpoints.up('md')} {
      border-radius: ${theme.shape.borderRadius(2)};
      box-shadow: ${theme.shadows.z3};
      margin: 2vh auto;
    }
  `,
  zoomContent: css`
    height: 100%;
    width: 100%;
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

  children?: ReactNode | ((width: number, height?: number) => ReactNode);

  // TODO: display loader when panel is loading
  loading?: boolean;

  zoomable?: boolean;
}

export function PanelContainer({
  isOpen,
  label,
  collapsible,
  onToggle,
  children,
  secondaryActions,
  primaryActions,
  zoomable = false,
}: Props) {
  const buttonStyles = useStyles2(clearButtonStyles);
  const styles = useStyles2(getStyles);
  const animStyles = useStyles2(getAnimStyles);
  const [ref, { width }] = useMeasure<HTMLDivElement>();
  const [zoomContentRef, { width: zoomedWidth, height: zoomedHeight }] = useMeasure<HTMLDivElement>();
  const [zoomedIn, setZoomedIn] = useState(false);
  const zoomElRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef(null);

  const { overlayProps, underlayProps } = useOverlay({ isOpen: zoomedIn }, zoomElRef);

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
            {(primaryActions || zoomable) && (
              <HorizontalGroup spacing="sm" justify="flex-start" align="center">
                {zoomable && <IconButton name="search-plus" onClick={() => setZoomedIn(true)} />}
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
      {zoomedIn && (
        <OverlayContainer>
          <CSSTransition nodeRef={backdropRef} appear in timeout={ANIMATION_DURATION} classNames={animStyles.underlay}>
            <div ref={backdropRef} onClick={() => setZoomedIn(false)} className={styles.underlay} {...underlayProps} />
          </CSSTransition>

          <CSSTransition
            nodeRef={zoomElRef}
            // onEntered={() => setAnimationComplete(true)}
            appear
            in
            timeout={ANIMATION_DURATION}
            classNames={animStyles.overlay}
          >
            <div {...overlayProps} className={styles.overlay} ref={zoomElRef}>
              <div>
                <IconButton name="times" onClick={() => setZoomedIn(false)} size="xl" tooltip="Close search" />
              </div>
              <div className={styles.zoomContent} ref={zoomContentRef}>
                {typeof children === 'function' ? children(zoomedWidth, zoomedHeight) : children}
              </div>
            </div>
          </CSSTransition>
        </OverlayContainer>
      )}
    </>
  );
}

const getAnimStyles = (theme: GrafanaTheme2) => {
  const commonTransition = {
    transitionDuration: `${ANIMATION_DURATION}ms`,
    transitionTimingFunction: theme.transitions.easing.easeInOut,
  };

  const underlayTransition = {
    [theme.breakpoints.up('md')]: {
      ...commonTransition,
      transitionProperty: 'opacity',
    },
  };

  const underlayClosed = {
    [theme.breakpoints.up('md')]: {
      opacity: 0,
    },
  };

  const underlayOpen = {
    [theme.breakpoints.up('md')]: {
      opacity: 1,
    },
  };

  const overlayTransition = {
    [theme.breakpoints.up('md')]: {
      ...commonTransition,
      transitionProperty: 'transform, opacity',
    },
  };

  const overlayClosed = {
    [theme.breakpoints.up('md')]: {
      transform: 'scale(0.1)',
      opacity: 0,
      transformOrigin: `center center`,
    },
  };

  const overlayOpen = {
    [theme.breakpoints.up('md')]: {
      transform: 'scale(1)',
      opacity: 1,
    },
  };

  return {
    overlay: {
      appear: css(overlayClosed),
      appearActive: css(overlayTransition, overlayOpen),
      appearDone: css(overlayOpen),
    },
    underlay: {
      appear: css(underlayClosed),
      appearActive: css(underlayTransition, underlayOpen),
      appearDone: css(underlayOpen),
    },
  };
};
