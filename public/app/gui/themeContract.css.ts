import { createThemeContract } from '@vanilla-extract/css';

// A theme contract is a bit like a typescript interface. The values in here don't matter
// as they're set in the actual theme.css.ts
export const theme = createThemeContract({
  space: {
    small: '',
    medium: '',
    large: '',
  },
  borderRadius: {
    small: '',
    medium: '',
    large: '',
  },
  colors: {
    background: {
      secondary: '',
    },
  },
});
