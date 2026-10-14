/**
 * Redirects for the 1.x URLs: chartist.dev served the 1.x docs before v2,
 * and those docs now live under `/v1/` (public/v1/). After the build, every
 * 1.x page whose path the v2 site doesn't have gets a small page at its old
 * file name that sends the visitor to the same page under `/v1/`, keeping
 * the query and `#hash`. Paths the v2 site has (`/`, `/api/`, `/examples/`)
 * keep their v2 page.
 *
 * The 1.x site had no trailing slashes and wrote `page.html` files, so the
 * redirect for `/api/classes/LineChart` is `api/classes/LineChart.html`,
 * which GitHub Pages serves for that URL.
 *
 * Redirect pages stay out of the sitemap (it lists Astro's pages only) and
 * out of search: they have no `data-pagefind-body`, and this integration
 * runs after the Pagefind one, so they don't exist yet when it indexes.
 */
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** The 1.x 404 page isn't a page anyone links to. */
const SKIPPED = new Set(['404']);

/** Marks a redirect page, so tests can tell it from a v2 page. */
export const REDIRECT_MARKER = 'data-v1-redirect';

/**
 * The 1.x pages under `root` as paths without `.html` (`api/basics`), and
 * `''` for the home page; folders' `index.html` count as the folder.
 * @param {string} root
 * @param {string} [folder]
 * @returns {Promise<string[]>}
 */
export async function v1Pages(root, folder = '') {
  const pages = [];
  const entries = await readdir(join(root, folder), { withFileTypes: true });
  for (const entry of entries) {
    const path = folder ? `${folder}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      pages.push(...(await v1Pages(root, path)));
    } else if (entry.name.endsWith('.html')) {
      const page = path.replace(/\.html$/, '').replace(/(^|\/)index$/, '');
      if (!SKIPPED.has(page)) {
        pages.push(page);
      }
    }
  }
  return pages.sort();
}

/**
 * The file a v1 page's redirect is written to, relative to the output.
 * @param {string} page
 */
export const redirectFile = page => `${page}.html`;

/**
 * The v2 files that would serve the page's path.
 * @param {string} page
 */
export const v2Files = page =>
  page === '' ? ['index.html'] : [`${page}.html`, `${page}/index.html`];

/**
 * The redirect page for a 1.x page.
 * @param {string} page the 1.x path, e.g. `api/classes/LineChart`
 * @param {{ base: string, site?: string }} options
 */
export function redirectPage(page, { base, site }) {
  const target = `${base.replace(/\/?$/, '/')}v1/${page}`;
  const canonical = site ? new URL(target, site).href : target;
  const json = JSON.stringify(target).replace(/</g, '\\u003c');
  return `<!doctype html>
<html lang="en" ${REDIRECT_MARKER}>
<head>
<meta charset="utf-8">
<title>Moved to the 1.x docs</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${canonical}">
<script>location.replace(${json} + location.search + location.hash);</script>
<meta http-equiv="refresh" content="0; url=${target}">
</head>
<body>
<p>This page of the Chartist 1.x docs moved to <a href="${target}">${canonical}</a>.</p>
</body>
</html>
`;
}

/**
 * @param {string} file
 */
async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}

/** @returns {import('astro').AstroIntegration} */
export function v1Redirects() {
  /** @type {{ base: string, site?: string }} */
  let options = { base: '/' };
  return {
    name: 'v1-redirects',
    hooks: {
      'astro:config:done': ({ config }) => {
        options = { base: config.base, site: config.site };
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        let redirected = 0;
        let kept = 0;
        for (const page of await v1Pages(join(out, 'v1'))) {
          const v2 = await Promise.all(
            v2Files(page).map(file => exists(join(out, file)))
          );
          if (v2.some(Boolean)) {
            kept += 1;
            continue;
          }
          const file = join(out, redirectFile(page));
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, redirectPage(page, options));
          redirected += 1;
        }
        logger.info(
          `Redirected ${redirected} 1.x pages to /v1/; ${kept} paths keep their v2 page.`
        );
      }
    }
  };
}
