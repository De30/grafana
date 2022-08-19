import { createTheme } from '@vanilla-extract/css';

import { theme } from './themeContract.css';

export const themeClass = createTheme(theme, {
  space: {
    small: '8px',
    medium: '16px',
    large: '32px',
  },

  typography: {
    standard: {
      fontSize: '14px',
      lineHeight: '1.1',
    },
  },

  size: {
    formControls: '32px',
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
      main: '#3D71D9', // background color
      shade: 'rgb(44, 90, 176)', // a darker variant of main, usually used for hover
      text: '#1F62E0',
      contrastText: '#FFFFFF', // color of text on top of main/shade
    },
    neutral: {
      // called secondary in grafana theme
      main: 'rgba(36, 41, 46, 0.16)', // background color
      shade: 'rgba(36, 41, 46, 0.20)', // a darker variant of main, usually used for hover
      text: 'rgba(36, 41, 46, 1)',
      contrastText: 'rgba(36, 41, 46,  1)', // color of text on top of main/shade
    },
    success: {
      main: '#1B855E', // background color
      shade: 'rgb(21, 106, 75)', // a darker variant of main, usually used for hover
      text: '#0A764E',
      contrastText: '#FFFFFF', // color of text on top of main/shade
    },
    critical: {
      main: '#E0226E', // background color
      shade: 'rgb(179, 27, 88)', // a darker variant of main, usually used for hover
      text: '#CF0E5B',
      contrastText: '#FFFFFF', // color of text on top of main/shade
    },
  },
});
