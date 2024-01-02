import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import json from '@rollup/plugin-json';

export default defineConfig((commendArgs) => {
  const env = process.env.NODE_ENV;
  return {
    input: 'src/index.ts',
    output: [
      {
        file: 'dist/index.cjs.js',
        format: 'cjs',
        sourcemap: env === 'production'
      },
      {
        file: 'dist/index.esm.js',
        format: 'esm',
        sourcemap: env === 'production'
      }
    ],
    plugins: [typescript({ sourceMap: true }), env === 'production' && terser()]
  };
});
