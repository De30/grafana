import { cloneDeep } from 'lodash';
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';

import { BusEventBase, NavModelItem, NavSection } from '@grafana/data';
import { config } from '@grafana/runtime';
import appEvents from 'app/core/app_events';
import { StoreState } from 'app/types';

import { enrichConfigItems, getActiveItem } from '../utils';

import { NavBarMenu } from './NavBarMenu';

const homeItem: NavModelItem = {
  id: 'home',
  text: 'Home',
  url: config.appSubUrl || '/',
  icon: 'home',
};

export class ToggleMegaMenu extends BusEventBase {
  static type = 'toggle-mega-menu';
}

export const MegaMenu = React.memo(() => {
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

  return <MegaMenuOpen onClose={() => setMenuOpen(false)} />;
});

MegaMenu.displayName = 'MegaMenu';

export interface Props {
  onClose: () => void;
}

export const MegaMenuOpen = React.memo<Props>(({ onClose }) => {
  const navBarTree = useSelector((state: StoreState) => state.navBarTree);
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
    navTree.filter((item) => item.section === NavSection.Config && item && item.id !== 'help' && item.id !== 'profile'),
    location,
    toggleSwitcherModal
  );

  const activeItem = getActiveItem(navTree, location.pathname);

  return (
    <NavBarMenu
      activeItem={activeItem}
      isOpen={true}
      setMenuAnimationInProgress={() => {}}
      navItems={[homeItem, ...coreItems, ...pluginItems, ...configItems]}
      onClose={onClose}
    />
  );
});

MegaMenuOpen.displayName = 'MegaMenuOpen';
