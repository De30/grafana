/** @type {import("snowpack").SnowpackUserConfig } */
export default {
  mount: {
    'public/views': { url: '/', static: true },
    public: { url: '/dist' },
  },
  workspaceRoot: './packages',
  plugins: [
    [
      '@snowpack/plugin-sass',
      {
        loadPath: './public/sass',
      },
    ],
    '@snowpack/plugin-react-refresh',
    '@snowpack/plugin-dotenv',
    '@snowpack/plugin-typescript',
  ],
  alias: {
    'app/': './public/app/',
    'vendor/': './public/vendor/',
    'base/': './public/sass/base/',
  },
  devOptions: {
    port: 4444,
  },
};
