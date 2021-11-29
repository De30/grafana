// This webpack config is used to separate the legacy files and build tools.

const path = require('path');
const { DllPlugin } = require('webpack');

// const vendorDeps = ['angular', 'angular-bindonce', 'angular-route', 'angular-sanitize'];

module.exports = {
  mode: 'development',
  entry: {
    angularApp: './public/app/angular/index.ts',
    // legacy: vendorDeps,
  },
  devtool: false,
  resolve: {
    extensions: ['.ts', '.tsx', '.es6', '.js', '.json', '.svg'],
    fallback: {
      stream: false,
      fs: false,
      string_decoder: false,
    },
  },
  ignoreWarnings: [/export .* was not found in/],
  // enable persistent cache for faster cold starts
  cache: {
    type: 'filesystem',
    name: 'angular-default-development',
    buildDependencies: {
      config: [__filename],
    },
  },

  module: {
    // Note: order is bottom-to-top and/or right-to-left
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true,
            cacheCompression: false,
          },
        },
        exclude: /node_modules/,
      },
      { test: /\.css$/, use: ['style-loader', 'css-loader'] },
      {
        test: /\.html$/,
        exclude: /(index|error)\-template\.html/,
        use: [
          {
            loader: 'ngtemplate-loader?relativeTo=' + path.resolve(__dirname, '../../public') + '&prefix=public',
          },
          {
            loader: 'html-loader',
            options: {
              sources: false,
              minimize: {
                removeComments: false,
                collapseWhitespace: false,
              },
            },
          },
        ],
      },
    ],
  },

  // https://webpack.js.org/guides/build-performance/#output-without-path-info
  output: {
    filename: '[name].dll.js',
    pathinfo: false,
    path: path.join(__dirname, '../../public/build'),
    library: '[name]_dll',
  },

  // https://webpack.js.org/guides/build-performance/#avoid-extra-optimization-steps
  optimization: {
    runtimeChunk: true,
    removeAvailableModules: false,
    removeEmptyChunks: false,
    splitChunks: false,
  },
  plugins: [
    new DllPlugin({
      name: '[name]_dll',
      path: path.join(__dirname, '../../public/build', '[name]-manifest.json'),
      entryOnly: true,
    }),
  ],
};
