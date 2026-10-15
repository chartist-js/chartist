/**
 * Writes dist/styles.css, the stylesheet for HTML output: the generated
 * "Chartist Terminal" font, embedded, and the rules, with the series colors
 * `chartist` exports, so the two can't drift apart. Embedded, the font
 * travels with the stylesheet: bundlers, CDNs and copied files need nothing
 * next to it.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { stylesheetRules } from '../src/styles.ts';
import { terminalFont } from './font.ts';

const font = Buffer.from(terminalFont()).toString('base64');
const css = `/* @chartist-js/terminal: styles for renderToHtml() output. */
@font-face {
  font-family: 'Chartist Terminal';
  src: url(data:font/woff;base64,${font}) format('woff');
  font-weight: 100 900;
  font-display: block;
}
${stylesheetRules()}`;

const dist = new URL('../dist/', import.meta.url);
await mkdir(dist, { recursive: true });
await writeFile(new URL('styles.css', dist), css);
