/**
 * Site search: indexes the built site with
 * Pagefind after the build, and serves the last build's index in dev.
 *
 * Only what's inside `data-pagefind-body` is indexed (guides, API pages,
 * example pages and the landing page). The archived 1.x docs (`v1/`) and
 * the card images (`og/`) stay out of the index.
 */
import { readFile, readdir } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Top-level folders of the output that are never indexed. */
const EXCLUDED = new Set(['v1', 'og', 'pagefind', 'playground-lib', '_astro']);
/**
 * Code blocks (Shiki's `<pre class="astro-code">`) count less than prose:
 * the guide that explains `showArea` beats the ones whose code uses it.
 */
const CODE_BLOCK = /<pre(?= class="astro-code)/g;
const CODE_WEIGHT = 'data-pagefind-weight="0.4"';
/** The last build's index, served in dev. */
const DEV_INDEX = fileURLToPath(
  new URL('../../../dist/apps/docs/pagefind/', import.meta.url)
);
const TYPES = {
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json'
};

/**
 * The output's HTML files (relative paths), without the excluded folders.
 * @param {string} root
 * @param {string} [folder]
 * @returns {AsyncGenerator<string>}
 */
async function* htmlFiles(root, folder = '') {
  const entries = await readdir(join(root, folder), { withFileTypes: true });
  for (const entry of entries) {
    const path = folder ? `${folder}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (!(folder === '' && EXCLUDED.has(entry.name))) {
        yield* htmlFiles(root, path);
      }
    } else if (entry.name.endsWith('.html')) {
      yield path;
    }
  }
}

/**
 * A page's URL from its file, without the base path: the dialog passes the
 * base to Pagefind (`baseUrl`), so the index works under any base.
 * @param {string} file
 */
function urlOf(file) {
  return `/${file.replace(/(^|\/)index\.html$/, '$1')}`;
}

/**
 * Dev: serves the last build's index at `<base>pagefind/`, if there is one.
 * @param {string} base
 * @returns {import('vite').Plugin}
 */
function devServer(base) {
  const prefix = `${base.replace(/\/?$/, '/')}pagefind/`;
  return {
    name: 'pagefind:dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const pathname = request.url?.split('?')[0] ?? '';
        if (!pathname.startsWith(prefix)) {
          return next();
        }
        const file = normalize(
          join(DEV_INDEX, decodeURIComponent(pathname.slice(prefix.length)))
        );
        if (!file.startsWith(DEV_INDEX)) {
          return next();
        }
        try {
          const body = await readFile(file);
          response.setHeader(
            'Content-Type',
            TYPES[extname(file)] ?? 'application/octet-stream'
          );
          response.end(body);
        } catch {
          // No index yet: the dialog says search works in the built site.
          response.statusCode = 404;
          response.end();
        }
      });
    }
  };
}

/** @returns {import('astro').AstroIntegration} */
export function pagefind() {
  return {
    name: 'pagefind',
    hooks: {
      'astro:config:setup': ({ config, updateConfig }) => {
        updateConfig({ vite: { plugins: [devServer(config.base)] } });
      },
      'astro:build:done': async ({ dir, logger }) => {
        const { close, createIndex } = await import('pagefind');
        const out = fileURLToPath(dir);
        const { index, errors } = await createIndex({
          excludeSelectors: [
            // A live example's controls: the file tab, "Live", the buttons.
            '[data-live-example] button',
            '[data-live-file]',
            '[data-live-example] .eyebrow'
          ]
        });
        if (!index) {
          throw new Error(`Pagefind: ${errors.join(', ')}`);
        }
        let pages = 0;
        for await (const file of htmlFiles(out)) {
          const content = await readFile(join(out, file), 'utf8');
          const added = await index.addHTMLFile({
            url: urlOf(file),
            content: content.replace(CODE_BLOCK, `<pre ${CODE_WEIGHT}`)
          });
          if (added.errors.length) {
            throw new Error(`Pagefind (${file}): ${added.errors.join(', ')}`);
          }
          pages += 1;
        }
        const written = await index.writeFiles({
          outputPath: join(out, 'pagefind')
        });
        if (written.errors.length) {
          throw new Error(`Pagefind: ${written.errors.join(', ')}`);
        }
        await close();
        logger.info(`Indexed ${pages} pages for search.`);
      }
    }
  };
}
