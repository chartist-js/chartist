/**
 * Serves the Chartist build for live examples at `<base>playground-lib/`:
 * index.js, compat.js (it imports ./index.js) and index.css.
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
const FILES = {
  'index.js': 'text/javascript',
  'compat.js': 'text/javascript',
  'index.css': 'text/css'
};
const PATTERN = /\/playground-lib\/(index\.js|compat\.js|index\.css)(?:\?.*)?$/;

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
              const body = await readFile(new URL(match[1], DIST));
              response.setHeader('Content-Type', FILES[match[1]]);
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
        for (const file of Object.keys(FILES)) {
          await copyFile(
            fileURLToPath(new URL(file, DIST)),
            fileURLToPath(new URL(file, target))
          );
        }
      }
    }
  };
}
