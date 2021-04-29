import React, { FC, ReactNode } from 'react';
import { css, cx } from '@emotion/css';
import { DateTimeInput, GrafanaThemeV2 } from '@grafana/data';
import { useStyles2 } from '../../themes/ThemeContext';
import { IconName } from '../../types';
import { Icon } from '../Icon/Icon';
import { styleMixins } from '../../themes';
import { IconButton } from '../IconButton/IconButton';
import { selectors } from '@grafana/e2e-selectors';

export interface Props {
  pageIcon?: IconName;
  title: string;
  libraryPanelMeta?: any;
  parent?: string;
  onGoBack?: () => void;
  onClickTitle?: () => void;
  onClickParent?: () => void;
  leftItems?: ReactNode[];
  children?: ReactNode;
  className?: string;
  isFullscreen?: boolean;
  formatDate?: (dateString: DateTimeInput, format?: string) => string;
}

/** @alpha */
export const PageToolbar: FC<Props> = React.memo(
  ({
    title,
    formatDate,
    libraryPanelMeta,
    parent,
    pageIcon,
    onGoBack,
    children,
    onClickTitle,
    onClickParent,
    leftItems,
    isFullscreen,
    className,
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

    return (
      <div className={mainStyle}>
        <div className={styles.toolbarLeft}>
          {pageIcon && !onGoBack && (
            <div className={styles.pageIcon}>
              <Icon name={pageIcon} size="lg" />
            </div>
          )}
          {onGoBack && (
            <div className={styles.goBackButton}>
              <IconButton
                name="arrow-left"
                tooltip="Go back (Esc)"
                tooltipPlacement="bottom"
                size="xxl"
                surface="dashboard"
                aria-label={selectors.components.BackButton.backArrow}
                onClick={onGoBack}
              />
            </div>
          )}
          <div className={styles.titleWrapper}>
            {parent && onClickParent && (
              <button onClick={onClickParent} className={cx(styles.titleLink, styles.parentLink)}>
                {parent} <span className={styles.parentIcon}>/</span>
              </button>
            )}
            <div className={styles.titleContainer}>
              {onClickTitle ? (
                <button onClick={onClickTitle} className={styles.titleLink}>
                  {title}
                </button>
              ) : (
                <div className={styles.titleText}>{title}</div>
              )}
              {libraryPanelMeta !== undefined && (
                <div className={styles.subtitleText}>
                  Used on {libraryPanelMeta.connectedDashboards}{' '}
                  {libraryPanelMeta.connectedDashboards === 1 ? 'dashboard' : 'dashboards'} | Last edited on{' '}
                  {formatDate?.(libraryPanelMeta.updated, 'L') ?? libraryPanelMeta.updated} by
                  {libraryPanelMeta.updatedBy.avatarUrl && (
                    <img
                      width="22"
                      height="22"
                      className={styles.userAvatar}
                      src={libraryPanelMeta.updatedBy.avatarUrl}
                      alt={`Avatar for ${libraryPanelMeta.updatedBy.name}`}
                    />
                  )}
                  {libraryPanelMeta.updatedBy.name}
                </div>
              )}
            </div>
          </div>
          {leftItems?.map((child, index) => (
            <div className={styles.leftActionItem} key={index}>
              {child}
            </div>
          ))}
        </div>
        <div className={styles.spacer}></div>
        {React.Children.toArray(children)
          .filter(Boolean)
          .map((child, index) => {
            return (
              <div className={styles.actionWrapper} key={index}>
                {child}
              </div>
            );
          })}
      </div>
    );
  }
);

PageToolbar.displayName = 'PageToolbar';

const getStyles = (theme: GrafanaThemeV2) => {
  const { spacing, typography } = theme;

  const titleStyles = `
      font-size: ${typography.size.lg};
      padding-left: ${spacing(1)};
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
      max-width: 240px;

      // clear default button styles
      background: none;
      border: none;

      @media ${styleMixins.mediaUp(theme.v1.breakpoints.xl)} {
        max-width: unset;
      }
  `;

  return {
    toolbar: css`
      display: flex;
      background: ${theme.colors.background.canvas};
      justify-content: flex-end;
      flex-wrap: wrap;
      padding: ${theme.spacing(0, 1, 1, 2)};
    `,
    toolbarLeft: css`
      display: flex;
      flex-grow: 1;
      min-width: 0;
    `,
    spacer: css`
      flex-grow: 1;
    `,
    pageIcon: css`
      padding-top: ${spacing(1)};
      align-items: center;
      display: none;

      @media ${styleMixins.mediaUp(theme.v1.breakpoints.md)} {
        display: flex;
      }
    `,
    titleWrapper: css`
      display: flex;
      align-items: center;
      padding-top: ${spacing(1)};
      padding-right: ${spacing(1)};
      min-width: 0;
      overflow: hidden;
    `,
    goBackButton: css`
      position: relative;
      top: 8px;
    `,
    parentIcon: css`
      margin-left: 4px;
    `,
    titleText: css`
      ${titleStyles};
    `,
    subtitleText: css`
      color: ${theme.colors.text.secondary};
      font-size: ${theme.typography.bodySmall.fontSize};
      padding-left: ${spacing(1)};
    `,
    titleContainer: css`
      display: flex;
      flex-direction: column;
    `,
    userAvatar: css`
      border-radius: 50%;
      box-sizing: content-box;
      width: 22px;
      height: 22px;
      padding-left: ${theme.spacing(1)};
      padding-right: ${theme.spacing(1)};
    `,
    titleLink: css`
      ${titleStyles};
    `,
    parentLink: css`
      display: none;

      @media ${styleMixins.mediaUp(theme.v1.breakpoints.md)} {
        display: inline-block;
      }
    `,
    actionWrapper: css`
      padding-left: ${spacing(1)};
      padding-top: ${spacing(1)};
    `,
    leftActionItem: css`
      display: none;
      height: 40px;
      position: relative;
      top: 5px;
      align-items: center;
      padding-left: ${spacing(0.5)};

      @media ${styleMixins.mediaUp(theme.v1.breakpoints.md)} {
        display: flex;
      }
    `,
  };
};
