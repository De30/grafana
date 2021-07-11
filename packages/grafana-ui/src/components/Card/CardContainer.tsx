import React, { HTMLAttributes, ReactNode } from 'react';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { styleMixins, stylesFactory, useTheme2 } from '../../themes';

/**
 * @public
 */
export interface CardInnerProps {
  href?: string;
  children?: ReactNode;
  className?: string;
}

const CardInner = ({ children, href, className }: CardInnerProps) => {
  return href ? (
    <a className={className} href={href}>
      {children}
    </a>
  ) : (
    <div className={className}>{children}</div>
  );
};

/**
 * @public
 */
export interface CardContainerProps extends HTMLAttributes<HTMLOrSVGElement>, CardInnerProps {
  /** Disable pointer events for the Card, e.g. click events */
  disableEvents?: boolean;
  /** No style change on hover */
  disableHover?: boolean;
  /** Custom container styles */
  className?: string;
  /** Controls internal padding and spacing, defaults to 2 (grid units) */
  internalSpacing?: number;
}

export const CardContainer = ({
  href,
  children,
  disableEvents,
  disableHover,
  internalSpacing = 2,
  className,
  ...props
}: CardContainerProps) => {
  const theme = useTheme2();
  const styles = getCardContainerStyles(theme, disableEvents, disableHover, internalSpacing);
  return (
    <div {...props} className={cx(styles.container, className)}>
      <CardInner className={styles.inner} href={href}>
        {children}
      </CardInner>
    </div>
  );
};

const getCardContainerStyles = stylesFactory(
  (theme: GrafanaTheme2, disabled = false, disableHover = false, internalSpacing: number) => {
    return {
      container: css({
        display: 'flex',
        width: '100%',
        background: theme.colors.background.secondary,
        borderRadius: theme.shape.borderRadius(),
        position: 'relative',
        pointerEvents: disabled ? 'none' : 'auto',
        marginBottom: theme.spacing(1),
        transition: theme.transitions.create(['background-color', 'box-shadow', 'border-color', 'color'], {
          duration: theme.transitions.duration.short,
        }),

        ...(!disableHover && {
          '&:hover': {
            background: theme.colors.emphasize(theme.colors.background.secondary, 0.03),
            cursor: 'pointer',
            zIndex: 1,
          },
          '&:focus': styleMixins.getFocusStyles(theme),
        }),
      }),
      inner: css({
        display: 'flex',
        width: '100%',
        padding: theme.spacing(internalSpacing),
      }),
    };
  }
);
