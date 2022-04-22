import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { css } from '@emotion/css';
import { cloneDeep } from 'lodash';
import { BusEventBase, GrafanaTheme2, NavModelItem, NavSection } from '@grafana/data';
import { useTheme2 } from '@grafana/ui';
import { config, locationService } from '@grafana/runtime';
import { StoreState } from 'app/types';
import { enrichConfigItems, getActiveItem, isSearchActive, SEARCH_ITEM_ID } from '../utils';
import { NavBarMenu } from './NavBarMenu';
import { useSelector } from 'react-redux';
import appEvents from 'app/core/app_events';

const onOpenSearch = () => {
  locationService.partial({ search: 'open' });
};

// Here we need to hack in a "home" NavModelItem since this is constructed in the frontend
const homeItem: NavModelItem = {
  id: 'home',
  text: 'Home',
  url: config.appSubUrl || '/',
  icon: 'grafana',
};

export class ToggleMegaMenu extends BusEventBase {
  static type = 'toggle-mega-menu';
}

export const MegaMenu = React.memo(() => {
  const navBarTree = useSelector((state: StoreState) => state.navBarTree);
  const theme = useTheme2();
  const styles = getStyles(theme);
  const location = useLocation();
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);
  const toggleSwitcherModal = () => {
    setShowSwitcherModal(!showSwitcherModal);
  };
  const navTree = cloneDeep(navBarTree);
  navTree.unshift(homeItem);

  const coreItems = navTree.filter((item) => item.section === NavSection.Core);
  const pluginItems = navTree.filter((item) => item.section === NavSection.Plugin);
  const configItems = enrichConfigItems(
    navTree.filter((item) => item.section === NavSection.Config),
    location,
    toggleSwitcherModal
  );
  const activeItem = getActiveItem(navTree, location.pathname);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const sub = appEvents.subscribe(ToggleMegaMenu, (evt) => {
      setMenuOpen(!menuOpen);
    });

    return () => sub.unsubscribe();
  }, [menuOpen, setMenuOpen]);

  if (!menuOpen) {
    return null;
  }

  return (
    <NavBarMenu
      activeItem={activeItem}
      isOpen={menuOpen}
      setMenuAnimationInProgress={() => {}}
      navItems={[homeItem, ...coreItems, ...pluginItems, ...configItems]}
      onClose={() => setMenuOpen(false)}
    />
  );
});

MegaMenu.displayName = 'MegaMenu';

const getStyles = (theme: GrafanaTheme2) => ({
  menuWrapper: css({
    position: 'fixed',
    top: '80px',
    display: 'grid',
    gridAutoFlow: 'column',
    height: '100%',
    zIndex: theme.zIndex.sidemenu,
  }),
});
