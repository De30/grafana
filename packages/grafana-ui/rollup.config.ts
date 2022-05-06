// import alias from '@rollup/plugin-alias';
// import commonjs from '@rollup/plugin-commonjs';
// import resolve from '@rollup/plugin-node-resolve';
// import svg from 'rollup-plugin-svg-import';
// import { terser } from 'rollup-plugin-terser';

// const pkg = require('./package.json');

// const libraryName = pkg.name;

// const buildCjsPackage = ({ env }) => {
//   return {
//     input: `compiled/index.js`,
//     output: [
//       {
//         dir: 'dist',
//         name: libraryName,
//         format: 'cjs',
//         sourcemap: true,
//         strict: false,
//         exports: 'named',
//         chunkFileNames: `[name].${env}.js`,
//         globals: {
//           react: 'React',
//           'prop-types': 'PropTypes',
//         },
//       },
//     ],
//     external: [
//       'react',
//       'react-dom',
//       '@grafana/aws-sdk',
//       '@grafana/data',
//       '@grafana/schema',
//       '@grafana/e2e-selectors',
//       'moment',
//       'jquery', // required to use jquery.plot, which is assigned externally
//       'react-inlinesvg', // required to mock Icon svg loading in tests
//       '@emotion/react',
//       '@emotion/css',
//     ],
//     plugins: [
//       commonjs({
//         include: /node_modules/,
//         ignoreTryCatch: false,
//       }),
//       resolve(),
//       svg({ stringify: true }),
//       env === 'production' && terser(),
//     ],
//   };
// };
// export default [buildCjsPackage({ env: 'development' }), buildCjsPackage({ env: 'production' })];

import resolve from '@rollup/plugin-node-resolve';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';
import svg from 'rollup-plugin-svg-import';

const name = require('./package.json').main.replace(/\.js$/, '');

const bundle = (config) => ({
  ...config,
  input: 'src/index.ts',
  external: (id) => !/^[./]/.test(id),
});

export default [
  bundle({
    plugins: [resolve(), svg({ stringify: true }), esbuild()],
    output: [
      {
        dir: './dist',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
        globals: {
          react: 'React',
          'prop-types': 'PropTypes',
        },
      },
      {
        dir: './dist',
        format: 'es',
        sourcemap: true,
        entryFileNames: `[name].mjs`,
        chunkFileNames: `[name].mjs`,
        globals: {
          react: 'React',
          'prop-types': 'PropTypes',
        },
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `./dist/index.d.ts`,
      format: 'es',
    },
  }),
];
