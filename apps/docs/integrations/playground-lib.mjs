/**
 * Serves the Chartist build for live examples at `<base>playground-lib/`:
 * index.js, compat.js (it imports ./index.js), index.css and
 * themes/accessible.css (as in the package's dist), the declarations
 * index.d.ts and compat.d.ts (for type-aware editing), and the
 * match-container polyfill that container query examples import.
 *
 * The playground's preview is a sandboxed iframe (origin `null`), so it
 * loads these cross-origin. Astro's dev server rejects cross-origin
 * subresource requests (403), so in dev a middleware placed ahead of that
 * check serves them with CORS; builds copy them into the output, and the
 * static host sends the CORS header (GitHub Pages sends `*`).
 */
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const DIST = new URL('../../../packages/chartist/dist/', import.meta.url);
const POLYFILL = new URL(
  '../node_modules/match-container/matchContainer.js',
  import.meta.url
);
/** Served name → source and type. */
const FILES = {
  'index.js': { source: new URL('index.js', DIST), type: 'text/javascript' },
  'compat.js': { source: new URL('compat.js', DIST), type: 'text/javascript' },
  'index.css': { source: new URL('index.css', DIST), type: 'text/css' },
  'index.d.ts': { source: new URL('index.d.ts', DIST), type: 'text/plain' },
  'compat.d.ts': { source: new URL('compat.d.ts', DIST), type: 'text/plain' },
  'themes/accessible.css': {
    source: new URL('themes/accessible.css', DIST),
    type: 'text/css'
  },
  'match-container.js': { source: POLYFILL, type: 'text/javascript' }
};
const PATTERN =
  /\/playground-lib\/(index\.js|compat\.js|index\.css|index\.d\.ts|compat\.d\.ts|themes\/accessible\.css|match-container\.js)(?:\?.*)?$/;

/** @returns {import('vite').Plugin} */
function devServer() {
  return {
    name: 'playground-lib:dev',
    apply: 'serve',
    // Post, so this runs after Astro's own post hook and can go first.
    enforce: 'post',
    configureServer(server) {
      return () => {
        server.middlewares.stack.unshift({
          route: '',
          handle: async (request, response, next) => {
            const match = request.url?.match(PATTERN);
            if (!match) {
              return next();
            }
            try {
              const file = FILES[match[1]];
              const body = await readFile(file.source);
              response.setHeader('Content-Type', file.type);
              response.setHeader('Access-Control-Allow-Origin', '*');
              response.end(body);
            } catch (error) {
              next(error);
            }
          }
        });
      };
    }
  };
}

/** @returns {import('astro').AstroIntegration} */
export function playgroundLib() {
  return {
    name: 'playground-lib',
    hooks: {
      'astro:config:setup': ({ updateConfig }) => {
        updateConfig({ vite: { plugins: [devServer()] } });
      },
      'astro:build:done': async ({ dir }) => {
        const target = new URL('playground-lib/', dir);
        await mkdir(target, { recursive: true });
        for (const [name, file] of Object.entries(FILES)) {
          await mkdir(new URL('.', new URL(name, target)), { recursive: true });
          await copyFile(
            fileURLToPath(file.source),
            fileURLToPath(new URL(name, target))
          );
        }
      }
    }
  };
}
