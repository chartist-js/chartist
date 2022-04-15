import swc from 'rollup-plugin-swc';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import pkg from './package.json';

const extensions = ['.js', '.ts', '.tsx'];
const external = _ => /node_modules/.test(_) && !/@swc\/helpers/.test(_);
const plugins = targets => [
  nodeResolve({
    extensions,
  }),
  swc({
    jsc: {
      parser: {
        syntax: 'typescript',
        tsx: true,
      },
      transform: {
        react: {
          useBuiltins: true,
        },
      },
      externalHelpers: true,
    },
    env: {
      targets,
    },
    module: {
      type: 'es6',
    },
    sourceMaps: true,
  }),
];

export default [
  {
    input: pkg.main,
    plugins: plugins('defaults, not ie 11, not ie_mob 11'),
    external,
    output: {
      file: pkg.publishConfig.main,
      format: 'cjs',
      exports: 'named',
      sourcemap: true,
    },
  },
  {
    input: pkg.main,
    plugins: plugins('defaults and supports es6-module'),
    external,
    output: {
      file: pkg.publishConfig.module,
      format: 'es',
      sourcemap: true,
    },
  },
];
