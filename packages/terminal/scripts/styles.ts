/**
 * Writes dist/styles.css, the stylesheet for HTML output, from the
 * series colors `chartist` exports, so the two can't drift apart.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { terminalStyles } from '../src/styles.ts';

const dist = new URL('../dist/', import.meta.url);
await mkdir(dist, { recursive: true });
await writeFile(new URL('styles.css', dist), terminalStyles());
