import { createTheme } from '@vanilla-extract/css';

import { theme } from './themeContract.css';

export const themeClass = createTheme(theme, {
  space: {
    small: '8px',
    medium: '16px',
    large: '32px',
  },
  borderRadius: {
    small: '2px',
    medium: '4px',
    large: '8px',
  },
  colors: {
    background: {
      secondary: '#F4F5F5',
    },
  },
});
