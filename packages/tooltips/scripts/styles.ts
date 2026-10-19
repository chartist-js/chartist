/** Copies the stylesheet to dist/styles.css, next to the build. */
import { copyFile, mkdir } from 'node:fs/promises';

const dist = new URL('../dist/', import.meta.url);
await mkdir(dist, { recursive: true });
await copyFile(
  new URL('../src/styles.css', import.meta.url),
  new URL('styles.css', dist)
);
