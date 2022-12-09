import { css, keyframes } from '@emotion/css';
import React from 'react';

import { useStyles2 } from '@grafana/ui/src/themes';

/**
 * @internal
 */
export interface LoadingBarProps {
  width?: string;
  height?: string;
  ariaLabel?: string;
}

/**
 * @internal
 */
export function LoadingBar({ width, height, ariaLabel = 'Loading bar' }: LoadingBarProps) {
  const styles = useStyles2(getStyles);
  const barWidth = width ?? '128px';
  const loadingHeigth = height ?? '2px';
  const barStyles = {
    background: 'linear-gradient(90deg, rgba(110, 159, 255, 0) 0%, #6E9FFF 80.75%, rgba(110, 159, 255, 0) 100%)',
    width: `${barWidth}`,
    height: `${loadingHeigth}`,
  };
  return (
    <div className={styles.container}>
      <div aria-label={ariaLabel} className={styles.bar1} style={barStyles} />
      <div aria-label={ariaLabel} className={styles.bar2} style={barStyles} />
    </div>
  );
}

const getStyles = () => {
  const loadingAnimation = keyframes({
    '0%': {
      transform: 'translateX(0)',
    },
    '100%': {
      transform: `translateX(calc(100%))`,
    },
  });

  return {
    container: css({
      width: '100%',
      animation: `${loadingAnimation} 1s infinite linear`,
      willChange: 'transform',
    }),
    bar1: css({
      position: 'absolute',
      top: 0,
      left: 0,
    }),
    bar2: css({
      position: 'absolute',
      top: 0,
      left: '-100%',
    }),
  };
};
