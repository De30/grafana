import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

import { themeContract } from './themeContract.css';

/**
 * We have two different concepts (or we will/show):
 *  - theme
 *  - sprinkles
 *
 * Theme is our structed design tokens. It contains the colours and sizes and
 * typography that we've curated and designed.
 *
 * Sprinkles is our opinionated high-level css framework that exposes the theme.
 * Most (basic?) styles should be written using spinkles, or via Box (which
 * exposes Sprinkles as a react component)
 */

const backgroundColors = {
  secondary: '#F4F5F5',
} as const;

const borderRadius = {
  small: 2,
  medium: 4,
  large: 8,
} as const;

const properties = defineProperties({
  properties: {
    padding: themeContract.space,
    margin: themeContract.space,
    background: backgroundColors,
    borderRadius: borderRadius,
    gridAutoFlow: ['row', 'column'],
    display: ['none', 'block', 'inline', 'inline-block', 'flex', 'grid'],
    gap: themeContract.space,
  },
});

export const sprinkles = createSprinkles(properties);

// It's a good idea to export the Sprinkles type too
export type Sprinkles = Parameters<typeof sprinkles>[0];
