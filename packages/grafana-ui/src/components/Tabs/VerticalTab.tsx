import React, { HTMLProps } from 'react';
import { css, cx } from 'emotion';
import { GrafanaTheme } from '@grafana/data';
import { selectors } from '@grafana/e2e-selectors';

import { Icon } from '../Icon/Icon';
import { IconName } from '../../types';
import { stylesFactory, useTheme } from '../../themes';
import { Counter } from './Counter';

export interface TabProps extends HTMLProps<HTMLLIElement> {
  label: string;
  active?: boolean;
  /** When provided, it is possible to use the tab as a hyperlink. Use in cases where the tabs update location. */
  href?: string;
  icon?: IconName;
  onChangeTab: (event?: React.MouseEvent<HTMLLIElement>) => void;
  /** A number rendered next to the text. Usually used to display the number of items in a tab's view. */
  counter?: number | null;
}

export const VerticalTab = React.forwardRef<HTMLLIElement, TabProps>(
  ({ label, active, icon, onChangeTab, counter, className, href, ...otherProps }, ref) => {
    const theme = useTheme();
    const tabsStyles = getTabStyles(theme);
    const content = () => (
      <>
        {icon && <Icon name={icon} />}
        {label}
        {typeof counter === 'number' && <Counter value={counter} />}
      </>
    );

    return (
      <li
        {...otherProps}
        className={cx(!href && tabsStyles.padding, tabsStyles.tabItem, active && tabsStyles.activeStyle)}
        onClick={onChangeTab}
        aria-label={otherProps['aria-label'] || selectors.components.Tab.title(label)}
        ref={ref}
      >
        {href ? (
          <a href={href} className={tabsStyles.padding}>
            {content()}
          </a>
        ) : (
          <>{content()}</>
        )}
      </li>
    );
  }
);

VerticalTab.displayName = 'Tab';

const getTabStyles = stylesFactory((theme: GrafanaTheme) => {
  const colors = theme.colors;

  return {
    tabItem: css`
      list-style: none;
      margin-right: ${theme.spacing.md};
      position: relative;
      display: block;
      color: ${colors.text};
      cursor: pointer;
      margin-bottom: 4px;

      svg {
        margin-right: ${theme.spacing.sm};
      }

      a {
        display: block;
        height: 100%;
      }
      &:hover,
      &:focus {
        color: ${colors.linkHover};
        background: linear-gradient(90deg, ff790029, #8eff0000);
      }
    `,
    padding: css`
      padding: 6px 12px;
    `,
    activeStyle: css`
      label: activeTabStyle;
      background: linear-gradient(90deg, #ff790040, #8eff0000);
      color: ${colors.link};
      overflow: hidden;

      &::before {
        display: block;
        content: ' ';
        position: absolute;
        left: 0;
        width: 2px;
        bottom: 0;
        top: 0;
        background-image: linear-gradient(0deg, #f05a28 30%, #fbca0a 99%);
      }
    `,
  };
});
