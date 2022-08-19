import { style } from '@vanilla-extract/css';
import { calc } from '@vanilla-extract/css-utils';

import { theme } from '../themeContract.css';

import { ButtonVariant, ButtonVibe } from './types';

const paddingV = calc(theme.size.formControls)
  .subtract(calc.multiply(theme.typography.standard.fontSize, theme.typography.standard.lineHeight))
  .divide(2)
  .toString();

const outlinePaddingV = calc.subtract(paddingV, '2px');
const outlinePaddingH = calc.subtract(theme.space.medium, '2px');

export const base = style({
  display: 'block',
  background: theme.colors.background.secondary, // the vibe will override this anyway
  fontSize: theme.typography.standard.fontSize,
  lineHeight: theme.typography.standard.lineHeight,
  fontWeight: 400,
  fontFamily: 'inherit',
  paddingLeft: theme.space.medium,
  paddingRight: theme.space.medium,
  paddingTop: paddingV,
  paddingBottom: paddingV,
  width: '100%',
  appearance: 'none',
  borderRadius: theme.borderRadius.medium,
});

export const stylesForVariant = {
  [ButtonVariant.Solid]: style({
    border: 'none',
    cursor: 'pointer',
  }),
  [ButtonVariant.Outline]: style({
    background: 'transparent',
    border: 'solid 2px black',
    paddingLeft: outlinePaddingH,
    paddingRight: outlinePaddingH,
    paddingTop: outlinePaddingV,
    paddingBottom: outlinePaddingV,
  }),
};

export const stylesForVibe = {
  [ButtonVariant.Solid]: {
    [ButtonVibe.Primary]: style({
      background: theme.colors.primary.main,
      color: theme.colors.primary.contrastText,
      ':hover': {
        background: theme.colors.primary.shade,
      },
    }),
    [ButtonVibe.Neutral]: style({
      background: theme.colors.neutral.main,
      color: theme.colors.neutral.contrastText,
      ':hover': {
        background: theme.colors.neutral.shade,
      },
    }),
    [ButtonVibe.Success]: style({
      background: theme.colors.success.main,
      color: theme.colors.success.contrastText,
      ':hover': {
        background: theme.colors.success.shade,
      },
    }),
    [ButtonVibe.Critical]: style({
      background: theme.colors.critical.main,
      color: theme.colors.critical.contrastText,
      ':hover': {
        background: theme.colors.critical.shade,
      },
    }),
  },

  [ButtonVariant.Outline]: {
    [ButtonVibe.Primary]: style({
      borderColor: theme.colors.primary.main,
      color: theme.colors.primary.text,
    }),
    [ButtonVibe.Neutral]: style({
      borderColor: theme.colors.neutral.main,
      color: theme.colors.neutral.text,
    }),
    [ButtonVibe.Success]: style({
      borderColor: theme.colors.success.main,
      color: theme.colors.success.text,
    }),
    [ButtonVibe.Critical]: style({
      borderColor: theme.colors.critical.main,
      color: theme.colors.critical.text,
    }),
  },
};
