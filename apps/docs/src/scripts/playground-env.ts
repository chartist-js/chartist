/**
 * What the site's live examples and its full-screen playground share: where
 * the Chartist build for the sandbox is served, the preview's theme, and the
 * playground's addresses.
 */
import { encodeShare } from '@chartist/playground/share';

// Served by integrations/playground-lib.mjs, with compat.js next to it.
const LIB = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}playground-lib/`;
/** Absolute URLs of the Chartist build and stylesheet for the sandbox. */
export const chartistUrl = new URL(`${LIB}index.js`, location.href).href;
export const stylesUrl = new URL(`${LIB}index.css`, location.href).href;
/** Bare imports beyond `chartist`: the container query polyfill. */
export const imports = {
  'match-container': new URL(`${LIB}match-container.js`, location.href).href
};

/**
 * Page tokens the preview needs to look like the page. Raw values, so
 * var() references in them resolve inside the preview as well.
 */
const TOKENS = [
  '--ink',
  '--ink-2',
  '--surface',
  '--line',
  '--font-body',
  '--ct-label-color',
  '--ct-label-size',
  '--ct-grid-color',
  '--ct-grid-dasharray',
  '--ct-line-width',
  '--ct-point-size',
  '--ct-bar-width',
  '--ct-area-opacity',
  '--ct-donut-width',
  ...'abcdefghijklmno'.split('').map(letter => `--ct-series-${letter}`)
];

/** CSS that gives the preview the page's current theme. */
export function previewStyles(): string {
  const root = getComputedStyle(document.documentElement);
  const tokens = TOKENS.map(
    name => `${name}: ${root.getPropertyValue(name).trim()};`
  ).join(' ');
  return `:root { ${tokens} color-scheme: ${root.colorScheme}; }
html, body { margin: 0; color: var(--ink); font-family: var(--font-body); }
body {
  background-color: var(--surface);
  background-image: radial-gradient(var(--line) 1px, transparent 1px);
  background-size: 16px 16px;
  padding: 16px 20px;
}`;
}

const PLAYGROUND = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}playground/`;

/** The full-screen playground for a gallery example, by id. */
export const playgroundForExample = (id: string) =>
  `${PLAYGROUND}#example=${id}`;

/** The full-screen playground for any files, encoded in the address. */
export async function playgroundForCode(
  files: Record<string, string>,
  title: string
) {
  return `${PLAYGROUND}#code=${await encodeShare({ files, title })}`;
}

/**
 * For gallery examples: they size their chart for a browser window
 * (`height: 50vh`, as the 1.x sandboxes did). In a preview frame the chart
 * is 16:10 instead, centered, and as large as the frame allows.
 */
export const FILL_FRAME = `
html, body { height: 100%; }
body { box-sizing: border-box; display: grid; place-items: center; }
#chart {
  width: min(100%, calc((100vh - 32px) * 1.6));
  height: auto !important;
  aspect-ratio: 16 / 10;
}`;
