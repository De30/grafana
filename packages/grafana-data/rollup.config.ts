import json from '@rollup/plugin-json';
import resolve from '@rollup/plugin-node-resolve';
import path from 'path';
import dts from 'rollup-plugin-dts';
import esbuild from 'rollup-plugin-esbuild';

const name = require('./package.json').main.replace(/\.js$/, '');

const bundle = (config) => ({
  input: 'src/index.ts',
  external: (id) => !/^[./]/.test(id),
  ...config,
});

export default [
  bundle({
    plugins: [
      resolve(),
      json({
        // absolute path throws an error for whatever reason
        include: [path.relative('.', require.resolve('moment-timezone/data/packed/latest.json'))],
      }),
      esbuild(),
    ],
    output: [
      {
        dir: './dist',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
      },
      {
        dir: './dist/esm',
        format: 'es',
        sourcemap: true,
        entryFileNames: `[name].js`,
        chunkFileNames: `[name].js`,
      },
    ],
  }),
  bundle({
    input: './compiled/index.d.ts',
    plugins: [dts()],
    output: {
      file: `${name}.d.ts`,
      format: 'es',
    },
  }),
];
