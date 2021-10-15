import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cloneDeep } from 'lodash';
import { css } from '@emotion/css';
import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { Icon, IconName, useTheme2 } from '@grafana/ui';
import { contextSrv } from 'app/core/services/context_srv';
import appEvents from '../../app_events';
import { ShowModalReactEvent } from '../../../types/events';
import config from '../../config';
import { OrgSwitcher } from '../OrgSwitcher';
import { getFooterLinks } from '../Footer/Footer';
import { HelpModal } from '../help/HelpModal';
import NavBarItem from './NavBarItem';
import { getForcedLoginUrl, isLinkActive, isSearchActive } from './utils';

const modulo = (a: number, n: number) => ((a % n) + n) % n;
const UNFOCUSED = -1;

export default function BottomSection() {
  const theme = useTheme2();
  const styles = getStyles(theme);
  const navTree: NavModelItem[] = cloneDeep(config.bootData.navTree);
  const bottomNav = navTree.filter((item) => item.hideFromMenu);
  const isSignedIn = contextSrv.isSignedIn;
  const location = useLocation();
  const activeItemId = bottomNav.find((item) => isLinkActive(location.pathname, item))?.id;
  const forcedLoginUrl = getForcedLoginUrl(location.pathname + location.search);
  const user = contextSrv.user;
  const [showSwitcherModal, setShowSwitcherModal] = useState(false);

  const toggleSwitcherModal = () => {
    setShowSwitcherModal(!showSwitcherModal);
  };

  const onOpenShortcuts = () => {
    appEvents.publish(new ShowModalReactEvent({ component: HelpModal }));
  };

  if (user && user.orgCount > 1) {
    const profileNode = bottomNav.find((bottomNavItem) => bottomNavItem.id === 'profile');
    if (profileNode) {
      profileNode.showOrgSwitcher = true;
      profileNode.subTitle = `Current Org.: ${user?.orgName}`;
    }
  }
  // a11y
  const menuRef = useRef<HTMLUListElement>(null);
  const [focusedItem, setFocusedItem] = useState(UNFOCUSED);
  const [shouldFocusSubItems, setShouldFocusSubItems] = useState(false);

  useEffect(() => {
    if (menuRef.current !== null) {
      const menuItems = menuRef.current?.querySelectorAll<HTMLLIElement>('[role="menuitem"]');
      // focus first item
      menuItems[focusedItem]?.focus();

      // close open submenus that are not in focus
      menuItems?.forEach((sub, index) => {
        if (index !== focusedItem && sub.getAttribute('aria-expanded') === 'true') {
          sub.setAttribute('aria-expanded', 'false');
        }
      });

      if (menuItems?.length) {
        menuItems.forEach((menuItem, index) => {
          menuItem.tabIndex = index === focusedItem ? 0 : -1;
        });
      }
    }
  }, [focusedItem, menuRef]);

  const handleKeys = (event: React.KeyboardEvent) => {
    //reset all aria-expanded
    const menuCount = menuRef?.current?.querySelectorAll(`:scope > li`)?.length ?? 0;

    //  Top level focused item
    const currentMenuItemFocus = menuRef.current?.children[focusedItem] as HTMLLIElement | null;

    switch (event.key) {
      case 'Tab': {
        event.stopPropagation();
        event.preventDefault();
        if (event.shiftKey) {
          setFocusedItem(modulo(focusedItem - 1, menuCount));
        } else {
          if (focusedItem === menuCount - 1) {
            if (currentMenuItemFocus?.getAttribute('aria-expanded') === 'true') {
              currentMenuItemFocus.setAttribute('aria-expanded', 'false');
              setFocusedItem(UNFOCUSED);
            }

            document.querySelector<HTMLAnchorElement>('.main-view a')?.focus();
          } else {
            setFocusedItem(modulo(focusedItem + 1, menuCount));
          }
        }
        //reset subindex
        // setFocusedSubItem(-1);
        break;
      }
      case 'ArrowRight': {
        event.stopPropagation();
        event.preventDefault();
        // focus  first element submenu
        if (currentMenuItemFocus?.getAttribute('aria-expanded') === 'true') {
          setShouldFocusSubItems(true);
        }
        break;
      }

      case 'ArrowDown': {
        event.stopPropagation();
        event.preventDefault();
        // focus  next element submenu
        if (!shouldFocusSubItems) {
          if (focusedItem === menuCount - 1) {
            if (currentMenuItemFocus?.getAttribute('aria-expanded') === 'true') {
              currentMenuItemFocus.setAttribute('aria-expanded', 'false');
              setFocusedItem(UNFOCUSED);
            }
            document.querySelector<HTMLAnchorElement>('nav a')?.focus();
          } else {
            setFocusedItem(modulo(focusedItem + 1, menuCount));
          }
        }

        break;
      }

      case 'ArrowUp': {
        event.stopPropagation();
        event.preventDefault();
        // focus  next element submenu
        if (!shouldFocusSubItems) {
          setFocusedItem(modulo(focusedItem - 1, menuCount));
        }
        break;
      }
      case 'ArrowLeft': {
        event.stopPropagation();
        event.preventDefault();
        // focus  first element submenu
        if (currentMenuItemFocus?.getAttribute('aria-expanded') === 'true') {
          setShouldFocusSubItems(false);
          currentMenuItemFocus?.focus();
        }
        break;
      }
      case 'Enter': {
        //close submenu
        if (currentMenuItemFocus?.getAttribute('aria-expanded') === 'true') {
          currentMenuItemFocus.setAttribute('aria-expanded', 'false');
          setFocusedItem(UNFOCUSED);
        }

        // go to link
        event.target.querySelector('a')?.click();
        event.target.querySelector('button')?.click();

        break;
      }
      case 'Escape':
      case 'Esc': {
        if (currentMenuItemFocus?.getAttribute('aria-expanded') === 'true') {
          currentMenuItemFocus.setAttribute('aria-expanded', 'false');
          setFocusedItem(UNFOCUSED);
        }

        document.querySelector<HTMLAnchorElement>('.main-view a')?.focus();
      }
      default:
        break;
    }
  };

  const handleFocus = () => {
    if (focusedItem === UNFOCUSED) {
      setFocusedItem(0);
    }
  };

  const handleHover = (event: React.MouseEvent) => {
    const currentMenuItemFocus = menuRef.current?.children[focusedItem] as HTMLLIElement | null;

    if (event.target !== currentMenuItemFocus) {
      currentMenuItemFocus?.setAttribute('aria-expanded', 'false');
      setFocusedItem(UNFOCUSED);
    }
  };

  return (
    <div data-testid="bottom-section-items" className={styles.container}>
      <ul role="menu" ref={menuRef} onKeyDown={handleKeys} onFocus={handleFocus} onMouseEnter={handleHover}>
        {!isSignedIn && (
          <NavBarItem label="Sign In" target="_self" url={forcedLoginUrl}>
            <Icon name="signout" size="xl" />
          </NavBarItem>
        )}
        {bottomNav.map((link, index) => {
          let menuItems = link.children || [];

          if (link.id === 'help') {
            menuItems = [
              ...getFooterLinks(),
              {
                text: 'Keyboard shortcuts',
                icon: 'keyboard',
                onClick: onOpenShortcuts,
              },
            ];
          }

          if (link.showOrgSwitcher) {
            menuItems = [
              ...menuItems,
              {
                text: 'Switch organization',
                icon: 'arrow-random',
                onClick: toggleSwitcherModal,
              },
            ];
          }

          return (
            <NavBarItem
              key={`${link.url}-${index}`}
              isActive={!isSearchActive(location) && activeItemId === link.id}
              label={link.text}
              menuItems={menuItems}
              menuSubTitle={link.subTitle}
              onClick={link.onClick}
              reverseMenuDirection
              target={link.target}
              url={link.url}
              shouldOpen={shouldFocusSubItems}
            >
              {link.icon && <Icon name={link.icon as IconName} size="xl" />}
              {link.img && <img src={link.img} alt={`${link.text} logo`} />}
            </NavBarItem>
          );
        })}
        {showSwitcherModal && <OrgSwitcher onDismiss={toggleSwitcherModal} />}
      </ul>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: none;

    ${theme.breakpoints.up('md')} {
      display: flex;
      flex-direction: inherit;
      margin-bottom: ${theme.spacing(2)};
    }

    .sidemenu-open--xs & {
      display: block;
    }
  `,
});
