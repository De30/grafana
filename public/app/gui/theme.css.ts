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
      page: '#111217',
      content: '#181b1f',
      secondary: '#F4F5F5',
    },
    primary: {
      main: '#3D71D9',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: 'rgba(36, 41, 46, 0.16)',
      contrastText: 'rgba(36, 41, 46,  1)',
    },
    success: {
      main: '#1B855E',
      contrastText: '#FFFFFF',
    },
    critical: {
      main: '#E0226E',
      contrastText: '#FFFFFF',
    },
  },
});
