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
  },
};
