import { style } from '@vanilla-extract/css';

import { theme } from '../themeContract.css';

import { ButtonVariant, ButtonVibe } from './types';

export const baseVariants = {
  [ButtonVariant.Solid]: style({
    border: 'none',
    cursor: 'pointer',
  }),
};

export const vibeVariants = {
  [ButtonVariant.Solid]: {
    [ButtonVibe.Primary]: style({
      background: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
    }),
    [ButtonVibe.Secondary]: style({
      background: theme.colors.secondary.main,
      color: theme.colors.secondary.contrastText,
    }),
    [ButtonVibe.Success]: style({
      background: theme.colors.success.main,
      color: theme.colors.success.contrastText,
    }),
    [ButtonVibe.Critical]: style({
      background: theme.colors.critical.main,
      color: theme.colors.critical.contrastText,
    }),
  },

  [ButtonVariant.Outline]: {
    [ButtonVibe.Primary]: style({
      borderColor: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
    }),
    [ButtonVibe.Secondary]: style({
      borderColor: theme.colors.secondary.main,
      color: theme.colors.secondary.contrastText,
    }),
    [ButtonVibe.Success]: style({
      borderColor: theme.colors.success.main,
      color: theme.colors.success.contrastText,
    }),
    [ButtonVibe.Critical]: style({
      borderColor: theme.colors.critical.main,
      color: theme.colors.critical.contrastText,
    }),
  },
};
