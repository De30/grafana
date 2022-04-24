import { css } from '@emotion/css';
import React from 'react';
import { useLocation } from 'react-router-dom';

import { GrafanaTheme2 } from '@grafana/data';
import { FilterInput, Icon, ModalsController, Tooltip, useTheme2 } from '@grafana/ui';
import { contextSrv } from 'app/core/core';
import { getKioskMode } from 'app/core/navigation/kiosk';
import { KioskMode } from 'app/types';

import { ProfileDrawer } from './ProfileDrawer';

export const TopBar = React.memo(() => {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const kiosk = getKioskMode();
  const location = useLocation();

  if (kiosk !== KioskMode.Off) {
    return null;
  }

  if (location.search.indexOf('editPanel') !== -1) {
    return null;
  }

  return (
    <div className={styles.topBar}>
      <div className={styles.logo}>
        <Icon name="grafana" size="xl" />
      </div>
      <div className={styles.searchWrapper}>
        <FilterInput
          width={50}
          placeholder="Search grafana"
          value={''}
          onChange={() => {}}
          className={styles.searchInput}
        />
      </div>
      <div className={styles.actions}>
        <Tooltip placement="bottom" content="Help menu (todo)">
          <button className={styles.actionItem}>
            <Icon name="question-circle" size="lg" />
          </button>
        </Tooltip>
        <Tooltip placement="bottom" content="Grafana news (todo)">
          <button className={styles.actionItem}>
            <Icon name="rss" size="lg" />
          </button>
        </Tooltip>
        <ModalsController key="button-save">
          {({ showModal, hideModal }) => (
            <Tooltip placement="bottom" content="User profile (todo)">
              <button className={styles.actionItem} onClick={() => showModal(ProfileDrawer, { onClose: hideModal })}>
                <img src={contextSrv.user.gravatarUrl} />
              </button>
            </Tooltip>
          )}
        </ModalsController>
      </div>
    </div>
  );
});

TopBar.displayName = 'TopBar';

const getStyles = (theme: GrafanaTheme2) => {
  return {
    topBar: css({
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      display: 'flex',
      background: theme.colors.background.primary,
      height: '40px',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: theme.spacing(0, 2),
      borderBottom: `1px solid ${theme.colors.border.weak}`,
      zIndex: theme.zIndex.sidemenu + 2,
    }),
    logo: css({
      display: 'flex',
    }),
    searchWrapper: css({}),
    searchInput: css({
      background: theme.colors.background.primary,
      // height: '40px',
      // '& input': {
      //   border: 'none',
      // },
    }),
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
      '&:hover': {
        background: theme.colors.background.secondary,
      },
      img: {
        borderRadius: '50%',
        width: '24px',
        height: '24px',
      },
    }),
  };
};
