import { GrafanaTheme } from '@grafana/data';
import { css, cx } from 'emotion';
import React from 'react';
import { useStyles } from '../../themes';

export interface Props extends React.HTMLAttributes<HTMLAnchorElement> {}

export const Link = React.forwardRef<HTMLAnchorElement, Props>(({ children, className, ...restProps }, ref) => {
  const style = useStyles(getStyles);
  return (
    <a className={cx(style, className)} {...restProps}>
      {children}
    </a>
  );
});

const getStyles = (theme: GrafanaTheme) => {
  return css`
    &:hover {
      color: ${theme.colors.textBlue};
      text-decoration: underline;
    }
  `;
};

Link.displayName = 'Link';
