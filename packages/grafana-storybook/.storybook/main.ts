const path = require('path');

module.exports = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.story.@(ts|tsx)'],
  addons: [
    '@storybook/addon-knobs/register',
    '@storybook/addon-actions/register',
    '@storybook/addon-docs',
    'storybook-dark-mode/register',
    '@storybook/addon-storysource',
  ],
  typescript: {
    check: true,
    checkOptions: {
      configFile: 'tsconfig.json',
    },
  },
  webpackFinal: async (config: any) => {
    config.module.rules.push({
      test: /\.scss$/,
      use: [
        {
          loader: 'style-loader',
          options: { injectType: 'lazyStyleTag' },
        },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 2,
          },
        },
        {
          loader: 'postcss-loader',
          options: {
            sourceMap: false,
            config: { path: path.resolve(__dirname, '../../../scripts/webpack/postcss.config.js') },
          },
        },
        {
          loader: 'sass-loader',
          options: {
            sourceMap: false,
          },
        },
      ],
    });

    config.resolve.alias['@grafana/ui'] = path.resolve(__dirname, '../../grafana-ui');
    config.resolve.alias['@grafana/data'] = path.resolve(__dirname, '../../grafana-data');
    config.resolve.alias['@grafana/e2e-selectors'] = path.resolve(__dirname, '../../grafana-e2e-selectors');

    return config;
  },
};
