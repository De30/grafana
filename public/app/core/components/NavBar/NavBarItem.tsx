import React, { ReactNode } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2, NavModelItem } from '@grafana/data';
import { IconName, Link, useTheme2 } from '@grafana/ui';
import NavBarDropdown from './NavBarDropdown';

import { MenuButton } from './TestMenu';
import { Item } from '@react-stately/collections';
import DropdownChild from './DropdownChild';
import { isSearchActive } from './utils';

export interface Props {
  isActive?: boolean;
  id: string;
  children: ReactNode;
  className?: string;
  label: string;
  menuItems?: NavModelItem[];
  menuSubTitle?: string;
  onClick?: () => void;
  reverseMenuDirection?: boolean;
  showMenu?: boolean;
  target?: HTMLAnchorElement['target'];
  url?: string;
}

const NavBarItem = ({
  isActive = false,
  link,
  children,
  className,
  label,
  menuItems = [],
  menuSubTitle,
  onClick,
  reverseMenuDirection = false,
  showMenu = true,
  target,
  url,
  index,
  id,
}: Props) => {
  const theme = useTheme2();

  const filteredItems = menuItems?.filter((item) => !item.hideFromMenu);

  const styles = getStyles(theme, isActive);
  let element = (
    <button className={styles.element} onClick={onClick} aria-label={label}>
      <span className={styles.icon}>{children}</span>
    </button>
  );

  if (url) {
    element =
      !target && url.startsWith('/') ? (
        <Link
          className={styles.element}
          href={url}
          target={target}
          aria-label={label}
          onClick={onClick}
          aria-haspopup="true"
        >
          <span className={styles.icon}>{children}</span>
        </Link>
      ) : (
        <a href={url} target={target} className={styles.element} onClick={onClick} aria-label={label}>
          <span className={styles.icon}>{children}</span>
        </a>
      );
  }

  const headerTarget = target;
  const headerText = label;
  const headerUrl = url;
  const onHeaderClick = onClick;

  let header = (
    <button onClick={onHeaderClick} className={styles.header} tabIndex={-1}>
      {headerText}
    </button>
  );

  if (headerUrl) {
    header =
      !headerTarget && headerUrl.startsWith('/') ? (
        <Link tabIndex={-1} href={headerUrl} onClick={onHeaderClick} className={styles.header}>
          {headerText}
        </Link>
      ) : (
        <a href={headerUrl} target={headerTarget} onClick={onHeaderClick} className={styles.header} tabIndex={-1}>
          {headerText}
        </a>
      );
  }

  return showMenu ? (
    <MenuButton link={link} isActive={isActive}>
      <Item key={id}>{header}</Item>
      {filteredItems?.map((item, index) => {
        return (
          <Item key={`${item.id}-${index}`} textValue={item.text}>
            <DropdownChild
              key={`${item.url}-${index}`}
              isDivider={item.divider}
              icon={item.icon as IconName}
              onClick={item.onClick}
              target={item.target}
              text={item.text}
              url={item.url}
            />
          </Item>
        );
      })}
    </MenuButton>
  ) : (
    <div className={cx(styles.container, 'dropdown', className, { dropup: reverseMenuDirection })}>{element}</div>
  );
};

export default NavBarItem;

const getStyles = (theme: GrafanaTheme2, isActive: Props['isActive'], filteredItems: Props['menuItems']) => {
  const adjustHeightForBorder = filteredItems?.length === 0;

  return {
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
        height: ${theme.spacing(3)};
        width: ${theme.spacing(3)};
      }
    `,
    header: css`
      align-items: center;
      background-color: ${theme.colors.background.secondary};
      border: none;
      color: ${theme.colors.text.primary};
      height: ${theme.components.sidemenu.width - (adjustHeightForBorder ? 2 : 1)}px;
      font-size: ${theme.typography.h4.fontSize};
      font-weight: ${theme.typography.h4.fontWeight};
      padding: ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(1)} ${theme.spacing(2)} !important;
      white-space: nowrap;
      width: 100%;

      &:hover {
        background-color: ${theme.colors.action.hover};
      }

      .sidemenu-open--xs & {
        display: flex;
        font-size: ${theme.typography.body.fontSize};
        font-weight: ${theme.typography.body.fontWeight};
        padding-left: ${theme.spacing(1)} !important;
      }
    `,
  };
};
