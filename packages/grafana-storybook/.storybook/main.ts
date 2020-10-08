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

    // Resolve grafana packages
    config.resolve.modules.push(path.resolve(__dirname, '../../grafana-ui'));
    config.resolve.modules.push(path.resolve(__dirname, '../../grafana-data'));

    return config;
  },
};
