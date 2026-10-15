/**
 * What the site's live examples and its full-screen playground share: where
 * the Chartist build for the sandbox is served, the preview's theme, and the
 * playground's addresses.
 */
import { encodeShare } from '@chartist/playground/share';
import pluginFiles from '../data/plugin-files.json';

// Served by integrations/playground-lib.mjs, with compat.js next to it.
const LIB = `${import.meta.env.BASE_URL.replace(/\/?$/, '/')}playground-lib/`;
/** Absolute URLs of the Chartist build and stylesheet for the sandbox. */
export const chartistUrl = new URL(`${LIB}index.js`, location.href).href;
export const stylesUrl = new URL(`${LIB}index.css`, location.href).href;
/**
 * Chartist's declarations, next to the build, for type-aware editing, and
 * those of the @chartist-js packages under their folders.
 */
export const types = {
  url: LIB,
  packages: { '@chartist-js/terminal': 'terminal/index.d.ts' }
};
const lib = (path: string) => new URL(`${LIB}${path}`, location.href).href;

/**
 * Bare names beyond `chartist`: the @chartist-js packages and their
 * stylesheets, the container query polyfill and the plugins of the plugins
 * page. A plugin's name maps to its
 * module build when it has one (for `import`), else to its script (for a
 * classic `<script src>`); `<name>/style` maps to its stylesheet.
 */
export const imports: Record<string, string> = {
  // Its build imports `chartist`, which the same map resolves.
  '@chartist-js/terminal': lib('terminal/index.js'),
  '@chartist-js/terminal/styles.css': lib('terminal/styles.css'),
  'match-container': lib('match-container.js'),
  ...Object.fromEntries(
    Object.entries(pluginFiles).flatMap(([name, files]) => {
      const file = (path: string) =>
        lib(`plugins/${name}/${path.slice(path.lastIndexOf('/') + 1)}`);
      const entries = [
        [name, file('module' in files ? files.module : files.script)]
      ];
      if ('style' in files) {
        entries.push([`${name}/style`, file(files.style)]);
      }
      return entries;
    })
  )
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
  // On the dotted background, dashed grid lines read as more dots: thin
  // solid lines instead. Examples can still set their own.
  return `:root { ${tokens} color-scheme: ${root.colorScheme};
  --ct-grid-dasharray: none;
  --ct-grid-color: color-mix(in oklab, var(--ink) 10%, transparent);
}
html, body { margin: 0; color: var(--ink); font-family: var(--font-body); }
html {
  scrollbar-color: color-mix(in oklab, var(--ink) 24%, transparent) transparent;
}
:where(*) { scrollbar-width: thin; }
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
 * For gallery examples. Most size their chart for a browser window
 * (`height: 50vh`, as the 1.x sandboxes did); in a preview frame that chart
 * fills the frame both ways instead, so a tall preview shows a tall chart.
 * Examples with their own layout keep it.
 */
export const FILL_FRAME = `
html, body { height: 100%; }
body { box-sizing: border-box; display: grid; place-items: center; }
body > * { width: 100%; }
#chart[style*="50vh"] {
  align-self: stretch;
  height: auto !important;
}`;
