import cx from 'classnames';
import React from 'react';

import { vibeVariants } from './button.css';
import { ButtonSize, ButtonVariant, ButtonVibe } from './types';

interface ButtonProps {
  variant: ButtonVariant;
  vibe: ButtonVibe;
  size: ButtonSize;
  children: React.ReactNode;
}

export function Button({ variant, vibe, children }: ButtonProps) {
  const vibeClass = vibeVariants[variant][vibe];

  return <button className={cx(vibeClass)}>{children}</button>;
}
