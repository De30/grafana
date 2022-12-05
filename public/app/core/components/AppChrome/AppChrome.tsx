import { css, cx } from '@emotion/css';
import React, { PropsWithChildren } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { useStyles2 } from '@grafana/ui';
import { useGrafana } from 'app/core/context/GrafanaContext';
import { KioskMode } from 'app/types';

import { MegaMenu } from '../MegaMenu/MegaMenu';

import { NavToolbar } from './NavToolbar';
import { TopSearchBar } from './TopSearchBar';
import { TOP_BAR_LEVEL_HEIGHT } from './types';

export interface Props extends PropsWithChildren<{}> {}

export function AppChrome({ children }: Props) {
  const styles = useStyles2(getStyles);
  const { chrome } = useGrafana();
  const state = chrome.useState();

  if (!config.featureToggles.topnav || config.isPublicDashboardView) {
    return <main className="main-view">{children}</main>;
  }

  const searchBarHidden = state.searchBarHidden || state.kioskMode === KioskMode.TV;

  const contentClass = cx({
    [styles.content]: true,
    [styles.contentNoSearchBar]: searchBarHidden,
    [styles.contentChromeless]: state.chromeless,
  });

  return (
    <main className="main-view">
      {!state.chromeless && (
        <div className={cx(styles.topNav)}>
          {!searchBarHidden && <TopSearchBar />}
          <NavToolbar
            searchBarHidden={searchBarHidden}
            sectionNav={state.sectionNav}
            pageNav={state.pageNav}
            actions={state.actions}
            onToggleSearchBar={chrome.onToggleSearchBar}
            onToggleMegaMenu={chrome.onToggleMegaMenu}
            onToggleKioskMode={chrome.onToggleKioskMode}
          />
        </div>
      )}
      <div className={contentClass}>{children}</div>
      {!state.chromeless && <MegaMenu searchBarHidden={searchBarHidden} onClose={() => chrome.setMegaMenu(false)} />}
    </main>
  );
}

const getStyles = (theme: GrafanaTheme2) => {
  return {
    content: css({
      display: 'flex',
      flexDirection: 'column',
      paddingTop: TOP_BAR_LEVEL_HEIGHT * 2,
      flexGrow: 1,
      height: '100%',
    }),
    contentNoSearchBar: css({
      paddingTop: TOP_BAR_LEVEL_HEIGHT,
    }),
    contentChromeless: css({
      paddingTop: 0,
    }),
    topNav: css({
      display: 'flex',
      position: 'fixed',
      zIndex: theme.zIndex.navbarFixed,
      left: 0,
      right: 0,
      boxShadow: theme.components.navbar.boxShadow,
      background: theme.components.navbar.background,
      flexDirection: 'column',
    }),
  };
};
