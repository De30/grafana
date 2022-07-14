import React, { FC } from 'react';

import { Button, IconName, LinkButton, PopoverContent, Tooltip, TooltipPlacement } from '@grafana/ui';

interface Props {
  tooltip: PopoverContent;
  icon: IconName;
  className?: string;
  tooltipPlacement?: TooltipPlacement;
  to?: string;
  target?: string;
  onClick?: () => void;
  'data-testid'?: string;
}

export const ActionIcon: FC<Props> = ({
  tooltip,
  icon,
  to,
  target,
  onClick,
  className,
  tooltipPlacement = 'top',
  ...rest
}) => {
  const ariaLabel = typeof tooltip === 'string' ? tooltip : undefined;

  return (
    <Tooltip content={tooltip} placement={tooltipPlacement}>
      {to ? (
        <LinkButton
          variant="secondary"
          fill="text"
          icon={icon}
          href={to}
          size="sm"
          target={target}
          {...rest}
          aria-label={ariaLabel}
        />
      ) : (
        <Button
          className={className}
          variant="secondary"
          fill="text"
          size="sm"
          icon={icon}
          type="button"
          onClick={onClick}
          {...rest}
          aria-label={ariaLabel}
        />
      )}
    </Tooltip>
  );
};
