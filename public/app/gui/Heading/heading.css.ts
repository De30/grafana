import { style } from '@vanilla-extract/css';

const fontWeightLight = 300;
const fontWeightRegular = 400;
const fontWeightMedium = 500;
// const fontWeightBold = 500;

export const headingStyles = {
  1: style({
    fontWeight: fontWeightLight,
    fontSize: 28,
    // lineHeight: 1.167,
    lineHeight: 1,
    margin: 0, // TODO: need a reset??
  }),

  2: style({
    fontWeight: fontWeightLight,
    fontSize: 24,
    // lineHeight: 1.2,
    lineHeight: 1,
    margin: 0, // TODO: need a reset??
  }),

  3: style({
    fontWeight: fontWeightRegular,
    fontSize: 21,
    // lineHeight: 1.167,
    lineHeight: 1,
    margin: 0, // TODO: need a reset??
  }),

  4: style({
    fontWeight: fontWeightRegular,
    fontSize: 18,
    // lineHeight: 1.235,
    lineHeight: 1,
    margin: 0, // TODO: need a reset??
  }),

  5: style({
    fontWeight: fontWeightRegular,
    fontSize: 16,
    // lineHeight: 1.334,
    lineHeight: 1,
    margin: 0, // TODO: need a reset??
  }),

  6: style({
    fontWeight: fontWeightMedium,
    fontSize: 14,
    // lineHeight: 1.6,
    lineHeight: 1,
    margin: 0, // TODO: need a reset??
  }),
} as const;
