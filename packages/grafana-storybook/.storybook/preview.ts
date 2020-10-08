import { addons } from '@storybook/addons';
import { GrafanaDark, GrafanaLight } from './storybookTheme';
import { withTheme } from '../utils/withTheme';
// @ts-ignore
import lightTheme from '../../../public/sass/grafana.light.scss';
// @ts-ignore
import darkTheme from '../../../public/sass/grafana.dark.scss';

addons.setConfig({
  showRoots: false,
  theme: GrafanaDark,
});

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
};
// info: {},
//   darkMode: {
//     dark: GrafanaDark,
//     light: GrafanaLight,
//   },
//   options: {
//     theme: GrafanaDark,
//     showPanel: true,
//     showRoots: true,
//     panelPosition: 'right',
//     showNav: true,
//     isFullscreen: false,
//     isToolshown: true,
//     storySort: (a: any, b: any) => {
//       if (a[1].kind.split('/')[0] === 'Docs Overview') {
//         return -1;
//       } else if (b[1].kind.split('/')[0] === 'Docs Overview') {
//         return 1;
//       }
//       return a[1].id.localeCompare(b[1].id);
//     },
//   },
//   knobs: {
//     escapeHTML: false,
//   },
// };

const handleThemeChange = (theme: any) => {
  if (theme !== 'light') {
    lightTheme.unuse();
    darkTheme.use();
  } else {
    darkTheme.unuse();
    lightTheme.use();
  }
};

// export const decorators = [withTheme(handleThemeChange)];
