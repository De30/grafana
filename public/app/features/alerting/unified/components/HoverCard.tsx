import { css } from '@emotion/css';
import { Placement } from '@popperjs/core';
import React, { FC, ReactElement, useRef } from 'react';

import { GrafanaTheme2 } from '@grafana/data';
import { Popover as GrafanaPopover, PopoverController, useStyles2 } from '@grafana/ui';

export interface HoverCardProps {
  children: ReactElement;
  content: ReactElement;
  wrapperClassName?: string;
  placement?: Placement;
  disabled?: boolean;
  padding?: number;
}

export const HoverCard: FC<HoverCardProps> = ({ children, content, disabled = false, padding, ...rest }) => {
  const popoverRef = useRef<HTMLElement>(null);
  const styles = useStyles2(getStyles({ padding }));

  if (disabled) {
    return children;
  }

  return (
    <PopoverController content={content} hideAfter={100}>
      {(showPopper, hidePopper, popperProps) => {
        return (
          <>
            {popoverRef.current && (
              <GrafanaPopover
                {...popperProps}
                {...rest}
                wrapperClassName={styles.popover}
                onMouseLeave={hidePopper}
                onMouseEnter={showPopper}
                referenceElement={popoverRef.current}
              />
            )}

            {React.cloneElement(children, {
              ref: popoverRef,
              onMouseEnter: showPopper,
              onMouseLeave: hidePopper,
            })}
          </>
        );
      }}
    </PopoverController>
  );
};

interface StyleProps {
  padding?: number;
}

const getStyles = (props: StyleProps) => (theme: GrafanaTheme2) => ({
  popover: css`
    border-radius: ${theme.shape.borderRadius()};
    box-shadow: ${theme.shadows.z3};
    background: ${theme.colors.background.primary};
    border: 1px solid ${theme.colors.border.medium};

    padding: ${theme.spacing(props.padding ?? 1)};
  `,
});
