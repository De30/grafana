import React from 'react';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { getKioskMode } from 'app/core/navigation/kiosk';
import { KioskMode } from 'app/types';
import { FilterInput, Icon, useTheme2 } from '@grafana/ui';
import { contextSrv } from 'app/core/core';

export const TopBar = React.memo(() => {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const kiosk = getKioskMode();

  if (kiosk !== KioskMode.Off) {
    return null;
  }

  return (
    <div className={styles.topBar}>
      <div className={styles.logo}>
        <Icon name="grafana" size="xl" />
      </div>
      <div className={styles.searchWrapper}>
        <FilterInput width={50} placeholder="Search grafana" value={''} onChange={() => {}} />
      </div>
      <div className={styles.actions}>
        <button className={styles.actionItem}>
          <Icon name="question-circle" size="lg" />
        </button>
        <button className={styles.actionItem}>
          <Icon name="rss" size="lg" />
        </button>
        <button className={styles.actionItem}>
          <img src={contextSrv.user.gravatarUrl} />
        </button>
      </div>
    </div>
  );
});

TopBar.displayName = 'TopBar';

const getStyles = (theme: GrafanaTheme2) => ({
  topBar: css({
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    background: theme.colors.background.secondary,
    height: '40px',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing(0, 2),
    boxShadow: 'inset 0 0 2px #000000',
    zIndex: 1,
  }),
  logo: css({
    display: 'flex',
  }),
  searchWrapper: css({}),
  actions: css({
    display: 'flex',
    flexGrow: 0,
    gap: theme.spacing(1),
  }),
  actionItem: css({
    display: 'flex',
    flexGrow: 0,
    border: 'none',
    boxShadow: 'none',
    background: 'none',
    alignItems: 'center',
    color: theme.colors.text.secondary,
    img: {
      borderRadius: '50%',
      width: '24px',
      height: '24px',
    },
  }),
});
