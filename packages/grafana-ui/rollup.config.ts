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
        dir: './dist/esm',
        format: 'es',
        sourcemap: true,
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
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
