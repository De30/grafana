import { css, cx } from '@emotion/css';
import React, { FC, ReactNode } from 'react';

import { GrafanaTheme2, NavModelItem } from '@grafana/data';

import { Icon, Link } from '..';
import { styleMixins } from '../../themes';
import { useStyles2 } from '../../themes/ThemeContext';
import { getFocusStyles } from '../../themes/mixins';
import { IconName } from '../../types';
import { IconButton } from '../IconButton/IconButton';

export interface Props {
  pageIcon?: IconName;
  title?: string;
  parent?: string;
  onOpenMenu?: () => void;
  onGoBack?: () => void;
  navModel?: NavModelItem;
  titleHref?: string;
  parentHref?: string;
  leftItems?: ReactNode[];
  children?: ReactNode;
  className?: string;
  isFullscreen?: boolean;
  'aria-label'?: string;
}

/** @alpha */
export const PageToolbar: FC<Props> = React.memo(
  ({
    title,
    parent,
    pageIcon,
    navModel,
    onGoBack,
    onOpenMenu,
    children,
    titleHref,
    parentHref,
    leftItems,
    isFullscreen,
    className,
    /** main nav-container aria-label **/
    'aria-label': ariaLabel,
  }) => {
    const styles = useStyles2(getStyles);

    /**
     * .page-toolbar css class is used for some legacy css view modes (TV/Kiosk) and
     * media queries for mobile view when toolbar needs left padding to make room
     * for mobile menu icon. This logic hopefylly can be changed when we move to a full react
     * app and change how the app side menu & mobile menu is rendered.
     */
    const mainStyle = cx(
      'page-toolbar',
      styles.toolbar,
      {
        ['page-toolbar--fullscreen']: isFullscreen,
      },
      className
    );

    function renderBreadcrumbs(node: NavModelItem, list: React.ReactNode[]) {
      if (node.parentItem) {
        renderBreadcrumbs(node.parentItem, list);
      }

      list.push(
        <li className={styles.breadcrumb}>
          {node.url && (
            <a className={cx(styles.breadcrumbLink, node.active && styles.breadcrumbLinkActive)} href={node.url}>
              {node.text}
            </a>
          )}
          {!node.url && (
            <span className={cx(styles.breadcrumbLink, node.active && styles.breadcrumbLinkActive)}>{node.text}</span>
          )}
        </li>
      );

      return list;
    }

    const breadcrumbs = navModel ? renderBreadcrumbs(navModel, []) : [];
    if (navModel) {
      breadcrumbs.unshift(
        <li className={styles.breadcrumb}>
          <a href="/" className={cx(styles.breadcrumbLink, styles.breadcrumbLinkHome)}>
            <Icon name="home-alt" size="sm" />
          </a>
        </li>
      );
    }

    return (
      <nav className={mainStyle} aria-label={ariaLabel}>
        <div className={styles.menuButton}>
          <IconButton
            name="bars"
            tooltip="Toggle menu"
            tooltipPlacement="bottom"
            size="xl"
            surface="dashboard"
            onClick={onOpenMenu}
          />
        </div>
        {breadcrumbs && (
          <ol aria-label="Search links" className={styles.breadcrumbList}>
            {breadcrumbs}
          </ol>
        )}
        <nav aria-label="Search links" className={styles.navElement}>
          {parent && parentHref && (
            <>
              <Link
                aria-label={`Search dashboard in the ${parent} folder`}
                className={cx(styles.titleText, styles.parentLink, styles.titleLink)}
                href={parentHref}
              >
                {parent} <span className={styles.parentIcon}></span>
              </Link>
              {titleHref && (
                <span className={cx(styles.titleText, styles.titleDivider, styles.parentLink)} aria-hidden>
                  /
                </span>
              )}
            </>
          )}
          {title && titleHref && (
            <h1 className={styles.h1Styles}>
              <Link
                aria-label="Search dashboard by name"
                className={cx(styles.titleText, styles.titleLink)}
                href={titleHref}
              >
                {title}
              </Link>
            </h1>
          )}
          {title && !titleHref && <h1 className={styles.titleText}>{title}</h1>}
        </nav>
        {leftItems?.map((child, index) => (
          <div className={styles.leftActionItem} key={index}>
            {child}
          </div>
        ))}

        <div className={styles.spacer} />
        {React.Children.toArray(children)
          .filter(Boolean)
          .map((child, index) => {
            return (
              <div className={styles.actionWrapper} key={index}>
                {child}
              </div>
            );
          })}
      </nav>
    );
  }
);

PageToolbar.displayName = 'PageToolbar';

const getStyles = (theme: GrafanaTheme2) => {
  const { spacing, typography } = theme;
  const shadow = theme.isDark
    ? `0 0.6px 1.5px rgb(0 0 0), 0 2px 4px rgb(0 0 0 / 40%), 0 5px 10px rgb(0 0 0 / 23%)`
    : '0 0.6px 1.5px rgb(0 0 0 / 8%), 0 2px 4px rgb(0 0 0 / 6%), 0 5px 10px rgb(0 0 0 / 5%)';
  const focusStyle = getFocusStyles(theme);

  const titleStyles = css`
    font-size: ${typography.body.fontSize};
    font-weight: ${typography.fontWeightMedium};
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    margin: 0;
    max-width: 240px;
    border-radius: 2px;

    @media ${styleMixins.mediaUp(theme.v1.breakpoints.xl)} {
      max-width: unset;
    }
  `;

  return {
    toolbar: css`
      align-items: center;
      background: ${theme.colors.background.primary};
      display: flex;
      flex-wrap: wrap;
      justify-content: flex-end;
      padding: ${theme.spacing(0, 2)};
      min-height: 40px;
      flex-shrink: 0;
      box-shadow: ${shadow};
      border-bottom: 1px solid ${theme.colors.border.weak};
      position: relative;
      z-index: ${theme.zIndex.sidemenu};

      // .toolbar-button {
      //   height: 40px;
      //   padding: ${theme.spacing(0, 2)};
      //   border-top: none;
      //   border-right: none;
      //   border-bottom: none;
      //   border-radius: 0;
      // }

      .toolbar-button {
        border: none;
        background: transparent;
      }
    `,
    spacer: css`
      flex-grow: 1;
    `,
    menuButton: css({
      display: 'flex',
      alignItems: 'center',
      paddingRight: '4px',
    }),
    pageIcon: css`
      display: none;
      @media ${styleMixins.mediaUp(theme.v1.breakpoints.md)} {
        display: flex;
        padding-right: ${theme.spacing(1)};
        align-items: center;
      }
    `,
    titleWrapper: css`
      display: flex;
      align-items: center;
      min-width: 0;
      overflow: hidden;
    `,
    navElement: css`
      display: flex;
    `,
    breadcrumbList: css`
      display: flex;
      font-size: ${theme.typography.bodySmall.fontSize};
      align-items: center;
      padding: ${theme.spacing(0, 1)};
    `,
    breadcrumb: css`
      display: flex;
      align-items: center;

      // &:first-child {
      //   > a,
      //   > span {
      //     clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
      //     border-radius: 4px;
      //   }
      // }

      // &:last-child {
      //   > a,
      //   > span {
      //     clip-path: polygon(0 0, 100% 0, 100% 100%, 0 100%, 8px 50%);
      //     border-radius: 4px;
      //   }
      // }
    `,
    breadcrumbLinkHome: css`
      clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%);
      padding: ${theme.spacing(0.5, 2, 0.5, 1.5)};
      border-radius: 4px;
    `,
    breadcrumbLink: css`
      background-color: ${theme.isDark ? '#374054' : '#ccddfe'};
      padding: ${theme.spacing(0.5, 2)};
      font-weight: 500;
      color: ${theme.isDark ? theme.colors.text : '#41587f'};
      clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%);

      &:hover {
        text-decoration: underline;
      }
    `,
    breadcrumbLinkActive: css`
      background-color: ${theme.colors.secondary.main};
      color: ${theme.colors.text.secondary};
      padding: ${theme.spacing(0.5, 2)};
      clip-path: polygon(0 0, calc(100% - 8px) 0, 100% 50%, calc(100% - 8px) 100%, 0 100%, 8px 50%);

      &:hover {
        text-decoration: underline;
      }
    `,

    h1Styles: css`
      margin: 0;
      line-height: inherit;
      display: flex;
    `,
    parentIcon: css`
      margin-left: ${theme.spacing(0.5)};
    `,
    titleText: titleStyles,
    titleLink: css`
      &:focus-visible {
        ${focusStyle}
      }
    `,
    titleDivider: css`
      padding: ${spacing(0, 0.5, 0, 0.5)};
    `,
    parentLink: css`
      display: none;
      @media ${styleMixins.mediaUp(theme.v1.breakpoints.md)} {
        display: unset;
      }
    `,
    actionWrapper: css`
      padding: ${spacing(0.5, 0, 0.5, 1)};
    `,
    leftActionItem: css`
      display: none;
      @media ${styleMixins.mediaUp(theme.v1.breakpoints.md)} {
        align-items: center;
        display: flex;
        padding-left: ${spacing(0.5)};
      }
    `,
  };
};
