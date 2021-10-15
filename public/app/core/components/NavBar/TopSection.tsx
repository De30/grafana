import React, { useRef, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cloneDeep } from 'lodash';
import { css } from '@emotion/css';
import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { locationService } from '@grafana/runtime';
import { Icon, IconName, useTheme2, ClickOutsideWrapper } from '@grafana/ui';
import config from '../../config';
import { isLinkActive, isSearchActive } from './utils';
import NavBarItem from './NavBarItem';

const modulo = (a: number, n: number) => ((a % n) + n) % n;
const UNFOCUSED = -1;

const TopSection = () => {
  const location = useLocation();
  const theme = useTheme2();
  const styles = getStyles(theme);
  const navTree: NavModelItem[] = cloneDeep(config.bootData.navTree);
  const mainLinks = navTree.filter((item) => !item.hideFromMenu);
  const activeItemId = mainLinks.find((item) => isLinkActive(location.pathname, item))?.id;
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
            document.querySelector<HTMLAnchorElement>('div[data-testid=bottom-section-items] a')?.focus();
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
            document.querySelector<HTMLAnchorElement>('div[data-testid=bottom-section-items] a')?.focus();
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

  const onOpenSearch = () => {
    locationService.partial({ search: 'open' });
  };

  const closeSubMenus = () => {};

  const handleHover = (event: React.MouseEvent) => {
    const currentMenuItemFocus = menuRef.current?.children[focusedItem] as HTMLLIElement | null;

    if (event.target !== currentMenuItemFocus) {
      currentMenuItemFocus?.setAttribute('aria-expanded', 'false');
      setFocusedItem(UNFOCUSED);
    }
  };

  return (
    <div data-testid="top-section-items" className={styles.container}>
      <ul role="menu" ref={menuRef} onKeyDown={handleKeys} onFocus={handleFocus} onMouseEnter={handleHover}>
        <NavBarItem
          shouldOpen={shouldFocusSubItems}
          isActive={isSearchActive(location)}
          label="Search dashboards"
          onClick={onOpenSearch}
        >
          <Icon name="search" size="xl" />
        </NavBarItem>
        {mainLinks.map((link, index) => {
          return (
            <NavBarItem
              key={`${link.id}-${index}`}
              isActive={!isSearchActive(location) && activeItemId === link.id}
              label={link.text}
              menuItems={link.children}
              target={link.target}
              url={link.url}
              shouldOpen={shouldFocusSubItems}
            >
              {link.icon && <Icon name={link.icon as IconName} size="xl" />}
              {link.img && <img src={link.img} alt={`${link.text} logo`} />}
            </NavBarItem>
          );
        })}
      </ul>
    </div>
  );
};

export default TopSection;

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    display: none;
    flex-grow: 1;

    ${theme.breakpoints.up('md')} {
      display: flex;
      flex-direction: inherit;
      margin-top: ${theme.spacing(5)};
    }

    .sidemenu-open--xs & {
      display: block;
    }
  `,
});
