import React, { ReactNode, useRef, useEffect, useState } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { Link, useTheme2 } from '@grafana/ui';
import NavBarDropdown from './NavBarDropdown';

export interface Props {
  isActive?: boolean;
  children: ReactNode;
  label: string;
  menuItems?: NavModelItem[];
  menuSubTitle?: string;
  onClick?: () => void;
  reverseMenuDirection?: boolean;
  target?: HTMLAnchorElement['target'];
  url?: string;
  shouldOpen?: boolean;
}

const modulo = (a: number, n: number) => ((a % n) + n) % n;
const UNFOCUSED = -1;

const NavBarItem = ({
  isActive = false,
  children,
  label,
  menuItems = [],
  menuSubTitle,
  onClick,
  reverseMenuDirection = false,
  target,
  url,
  shouldOpen = false,
}: Props) => {
  const theme = useTheme2();
  const styles = getStyles(theme, isActive);
  let element = (
    <button className={styles.element} onClick={onClick} aria-label={label}>
      <span className={styles.icon}>{children}</span>
    </button>
  );
  const navItemRef = useRef<HTMLLIElement>(null);
  const [focusedSubNavItem, setFocusedSubNavItem] = useState(UNFOCUSED);

  useEffect(() => {
    if (navItemRef.current !== null) {
      const navSubItems = navItemRef?.current?.querySelectorAll<HTMLLIElement>(':scope > ul > li');
      navSubItems[focusedSubNavItem]?.focus();

      navSubItems?.forEach((subItem, index) => {
        if (shouldOpen && index === focusedSubNavItem) {
          subItem.tabIndex = 0;
        } else {
          subItem.tabIndex = -1;
        }
      });
    }
  }, [navItemRef, shouldOpen, focusedSubNavItem]);

  if (url) {
    element =
      !target && url.startsWith('/') ? (
        <Link className={styles.element} href={url} target={target} aria-label={label} onClick={onClick}>
          <span className={styles.icon}>{children}</span>
        </Link>
      ) : (
        <a href={url} target={target} className={styles.element} onClick={onClick} aria-label={label}>
          <span className={styles.icon}>{children}</span>
        </a>
      );
  }

  const handleKeys = (event: React.KeyboardEvent) => {
    const navSubItemsCount = navItemRef?.current?.querySelectorAll<HTMLLIElement>(':scope > ul > li').length ?? 0;
    switch (event.key) {
      case 'ArrowRight': {
        const nextFocusSubItem = modulo(focusedSubNavItem + 1, navSubItemsCount);
        setFocusedSubNavItem(nextFocusSubItem);
        break;
      }
      case 'ArrowDown': {
        const nextFocusSubItem = modulo(focusedSubNavItem + 1, navSubItemsCount);
        setFocusedSubNavItem(nextFocusSubItem);
        break;
      }
      case 'ArrowUp': {
        const nextFocusSubItem = modulo(focusedSubNavItem - 1, navSubItemsCount);
        setFocusedSubNavItem(nextFocusSubItem);
        break;
      }
      case 'ArrowLeft': {
        setFocusedSubNavItem(UNFOCUSED);
        break;
      }

      case 'Enter': {
        setFocusedSubNavItem(UNFOCUSED);

        break;
      }

      default:
        break;
    }
  };

  const handleFocus = () => {
    // open tv mode
    navItemRef.current?.setAttribute('aria-expanded', 'true');
  };

  return (
    <li
      role="menuitem"
      aria-haspopup={menuItems?.length > 0 ? 'true' : false}
      className={cx(styles.container, 'dropdown', { dropup: reverseMenuDirection })}
      onFocus={handleFocus}
      ref={navItemRef}
      onKeyDown={handleKeys}
    >
      {element}
      <NavBarDropdown
        headerTarget={target}
        headerText={label}
        headerUrl={url}
        items={menuItems}
        onHeaderClick={onClick}
        reverseDirection={reverseMenuDirection}
        subtitleText={menuSubTitle}
      />
    </li>
  );
};

export default NavBarItem;

const getStyles = (theme: GrafanaTheme2, isActive: Props['isActive']) => ({
  container: css`
    position: relative;

    @keyframes dropdown-anim {
      0% {
        opacity: 0;
      }
      100% {
        opacity: 1;
      }
    }

    ${theme.breakpoints.up('md')} {
      color: ${isActive ? theme.colors.text.primary : theme.colors.text.secondary};

      &:hover {
        background-color: ${theme.colors.action.hover};
        color: ${theme.colors.text.primary};

        .dropdown-menu {
          animation: dropdown-anim 150ms ease-in-out 100ms forwards;
          display: flex;
          // important to overlap it otherwise it can be hidden
          // again by the mouse getting outside the hover space
          left: ${theme.components.sidemenu.width - 1}px;
          margin: 0;
          opacity: 0;
          top: 0;
          z-index: ${theme.zIndex.sidemenu};
        }

        &.dropup .dropdown-menu {
          top: auto;
        }
      }

      &[aria-expanded='true'] {
        .dropdown-menu {
          animation: dropdown-anim 150ms ease-in-out 100ms forwards;
          display: flex;
          // important to overlap it otherwise it can be hidden
          // again by the mouse getting outside the hover space
          left: ${theme.components.sidemenu.width - 1}px;
          margin: 0;
          opacity: 0;
          top: 0;
          z-index: ${theme.zIndex.sidemenu};
        }
      }
    }
  `,
  element: css`
    background-color: transparent;
    border: none;
    color: inherit;
    display: block;
    line-height: ${theme.components.sidemenu.width}px;
    padding: 0;
    text-align: center;
    width: ${theme.components.sidemenu.width}px;

    &::before {
      display: ${isActive ? 'block' : 'none'};
      content: ' ';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      border-radius: 2px;
      background-image: ${theme.colors.gradients.brandVertical};
    }

    &:focus-visible {
      background-color: ${theme.colors.action.hover};
      box-shadow: none;
      color: ${theme.colors.text.primary};
      outline: 2px solid ${theme.colors.primary.main};
      outline-offset: -2px;
      transition: none;
    }

    .sidemenu-open--xs & {
      display: none;
    }
  `,
  icon: css`
    height: 100%;
    width: 100%;

    img {
      border-radius: 50%;
      height: 28px;
      width: 28px;
    }
  `,
});
