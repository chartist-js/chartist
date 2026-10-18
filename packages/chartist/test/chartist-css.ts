/**
 * Chartist's stylesheet, compiled from the Sass sources, for the server
 * tests that apply it without a build: the same rules as dist/index.css.
 */
import { fileURLToPath } from 'node:url';
import { compile, Logger } from 'sass';

export const chartistCss = compile(
  fileURLToPath(new URL('../src/styles/index.scss', import.meta.url)),
  { logger: Logger.silent }
).css;
