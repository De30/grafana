import cx from 'classnames';
import React from 'react';

import { base, stylesForVariant, stylesForVibe } from './button.css';
import { ButtonSize, ButtonVariant, ButtonVibe } from './types';

interface ButtonProps {
  variant: ButtonVariant;
  vibe: ButtonVibe;
  size: ButtonSize;
  children: React.ReactNode;
}

export function Button({ variant, vibe, children }: ButtonProps) {
  const vibeClass = stylesForVibe[variant][vibe];
  const variantClass = stylesForVariant[variant];

  return <button className={cx(base, variantClass, vibeClass)}>{children}</button>;
}
