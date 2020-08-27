const stories = ['../src/**/*.story.{js,tsx,ts,tsx,mdx}'];

if (process.env.NODE_ENV !== 'production') {
  stories.push('../src/**/*.story.{js,tsx,ts,tsx,mdx}');
}

module.exports = {
  stories: stories,
  addons: [
    '@storybook/addon-knobs/register',
    '@storybook/addon-actions/register',
    {
      name: '@storybook/addon-docs',
      options: { mdxBabelOptions: { babelrc: true, configFile: true } },
    },
    'storybook-dark-mode/register',
    '@storybook/addon-storysource',
  ],
};
