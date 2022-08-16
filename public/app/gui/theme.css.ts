import { createTheme } from '@vanilla-extract/css';

import { themeContract } from './themeContract.css';

export const themeClass = createTheme(themeContract, {
  space: {
    small: '8px',
    medium: '16px',
    large: '32px',
  },
});
