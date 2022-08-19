import { defineProperties, createSprinkles } from '@vanilla-extract/sprinkles';

import { theme } from './themeContract.css';

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
const properties = defineProperties({
  properties: {
    padding: theme.space,
    margin: theme.space,
    background: theme.colors.background,
    borderRadius: theme.borderRadius,
    gridAutoFlow: ['row', 'column'],
    flexDirection: ['row', 'column'],
    flexWrap: ['wrap', 'nowrap'],
    display: ['none', 'block', 'inline', 'inline-block', 'flex', 'grid'],
    gap: theme.space,
  },
});

export const sprinkles = createSprinkles(properties);

// It's a good idea to export the Sprinkles type too
export type Sprinkles = Parameters<typeof sprinkles>[0];
