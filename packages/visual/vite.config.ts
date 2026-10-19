/**
 * Vite dev server for the visual regression tests.
 *
 * Serves every example of @chartist/examples at /<type>/<name>/, with
 * `chartist` resolved to the build under test:
 *
 * - CHARTIST_LIB unset or "local": the workspace's chartist build (its dist)
 * - CHARTIST_LIB=v1: published chartist@1.5.0 (the chartist-v1 alias)
 *
 * The example files are served unchanged. A harness plugin only adds the
 * screenshot environment to each page: the bundled test font, a fixed chart
 * container size and a neutral body margin. `?entry=classic` loads the
 * example's classic entry (src/main.classic.ts) instead of src/main.ts.
 */
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import { examples } from '@chartist/examples';

const require = createRequire(import.meta.url);
const pkgDir = fileURLToPath(new URL('.', import.meta.url));
const examplesDir = path.dirname(
  require.resolve('@chartist/examples/package.json')
);

export const lib = process.env.CHARTIST_LIB === 'v1' ? 'v1' : 'local';
const fixtureDir = fileURLToPath(new URL('fixture', import.meta.url));
const libDir =
  lib === 'v1'
    ? // chartist@1.5.0 doesn't export its package.json, so no require.resolve.
      path.join(pkgDir, 'node_modules/chartist-v1/dist')
    : path.join(path.dirname(require.resolve('chartist/package.json')), 'dist');

const font = readFileSync(
  fileURLToPath(
    new URL('fixture/inter-latin-400-normal.woff2', import.meta.url)
  )
).toString('base64');

/** The chart container size of examples with `size: 'fixed'`. */
export const FIXED_SIZE = { width: 640, height: 360 };

function screenshotEnvironment(sized: boolean) {
  return `
    @font-face {
      font-family: 'Chartist Visual Test';
      font-display: block;
      src: url(data:font/woff2;base64,${font}) format('woff2');
    }
    body {
      margin: 0;
      font-family: 'Chartist Visual Test';
    }
    ${
      sized
        ? `#chart {
      width: ${FIXED_SIZE.width}px !important;
      height: ${FIXED_SIZE.height}px !important;
    }`
        : ''
    }`;
}

function visualHarness(): Plugin {
  const byFolder = new Map(examples.map(example => [example.folder, example]));

  return {
    name: 'chartist-visual-harness',
    // The log level hides Vite's own start message; the test runner waits
    // for this one.
    configureServer(server) {
      server.httpServer?.once('listening', () =>
        console.log('visual server listening')
      );
    },
    transformIndexHtml: {
      order: 'pre',
      handler(html, { path: urlPath, originalUrl }) {
        const folder = urlPath.replace(/^\//, '').replace(/\/index\.html$/, '');
        const example = byFolder.get(folder);
        if (!example) {
          return html;
        }

        return {
          // In a standalone Vite app, /src/main.ts is at the app root; here the
          // example is a subfolder of the server root.
          html: html.replace(
            'src="/src/main.ts"',
            `src="/${example.folder}/src/${
              /[?&]entry=classic\b/.test(originalUrl ?? '')
                ? 'main.classic.ts'
                : 'main.ts'
            }"`
          ),
          tags: [
            {
              tag: 'style',
              attrs: { 'data-visual-harness': '' },
              children: screenshotEnvironment(example.size === 'fixed'),
              injectTo: 'head'
            }
          ]
        };
      }
    }
  };
}

export default defineConfig({
  root: examplesDir,
  appType: 'mpa',
  logLevel: 'warn',
  clearScreen: false,
  // Keep Vite's dependency cache out of the examples package.
  cacheDir: path.join(pkgDir, 'node_modules/.vite-visual'),
  resolve: {
    alias: [
      { find: /^chartist\/styles\.css$/, replacement: `${libDir}/index.css` },
      { find: /^chartist$/, replacement: `${libDir}/index.js` },
      {
        // 1.5.0 has no compat plugin; it emits the 1.x events natively.
        find: /^chartist\/compat$/,
        replacement:
          lib === 'v1' ? `${fixtureDir}/compat-v1.ts` : `${libDir}/compat.js`
      }
    ]
  },
  // Serve the build under test as is: no dependency pre-bundling.
  optimizeDeps: { noDiscovery: true, include: [] },
  server: {
    hmr: false,
    watch: null,
    fs: {
      allow: [examplesDir, libDir, fixtureDir]
    }
  },
  plugins: [visualHarness()]
});
