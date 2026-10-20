/**
 * Redirect pages of the static site: a small page at an old path that sends
 * the visitor on, keeping the query and `#hash` (with JavaScript; the meta
 * refresh without it drops them). Used for the 1.x URLs (v1-redirects.mjs)
 * and for pages the site published and later removed (`MOVED_PAGES`).
 *
 * Astro's own `redirects` config writes a similar page, but its meta
 * refresh loses the `#hash`.
 *
 * Redirect pages stay out of the sitemap (it lists Astro's pages only) and
 * out of search: they have no `data-pagefind-body`, and the integrations
 * that write them run after the Pagefind one, so they don't exist yet when
 * it indexes.
 */
import { mkdir, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

/** Marks a redirect page, so tests can tell it from a page of the site. */
export const REDIRECT_MARKER = 'data-redirect';

/**
 * Pages the site published and removed, by path below the base, and the
 * page that covers their content now.
 * @type {Readonly<Record<string, string>>}
 */
export const MOVED_PAGES = {
  // The plugin left the plugin list: targetLine() of @chartist-js/essentials
  // covers it.
  'plugins/chartist-plugin-targetline/': 'packages/essentials/target-lines/',
  // The guide to updating charts grew into the live updates guide.
  'docs/updating-charts/': 'docs/live-updates/'
};

/**
 * A path below the base as a path from the root.
 * @param {string} base
 * @param {string} path
 */
export const withBase = (base, path) => `${base.replace(/\/?$/, '/')}${path}`;

/** A value as a JavaScript literal that is safe inside `<script>`. */
const scriptLiteral = value => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * The redirect script for a page with an anchor table: a `#hash` in the
 * table goes to its own target, any other `#hash` to `fallback` with the
 * hash, no hash to `target`; the query is kept. A hash ending in `-code`
 * (a code block) counts as the hash it belongs to.
 * @param {string} target
 * @param {{ table: Readonly<Record<string, string>>, fallback: string }} anchors
 */
const anchorScript = (target, { table, fallback }) =>
  `(function () {
  var table = ${scriptLiteral(table)};
  var has = function (key) { return Object.prototype.hasOwnProperty.call(table, key); };
  var hash = location.hash.slice(1);
  var key = has(hash) ? hash : hash.replace(/-code$/, '');
  var to = !hash ? ${scriptLiteral(target)} : has(key) ? table[key] : ${scriptLiteral(fallback)} + location.hash;
  var url = new URL(to, location.href);
  url.search = location.search;
  location.replace(url.href);
})();`;

/**
 * A redirect page to `target`, a path from the root or a full URL.
 * @param {string} target
 * @param {{
 *   site?: string,
 *   title: string,
 *   text: string,
 *   anchors?: { table: Readonly<Record<string, string>>, fallback: string },
 *   noindex?: boolean
 * }} options `text` comes before the link to the target. With `anchors`,
 * the script picks the target by the `#hash` (see `anchorScript`); without,
 * it keeps the hash. `noindex: false` leaves out the robots tag, for pages
 * on another host whose redirect search engines should follow.
 */
export function redirectHtml(
  target,
  { site, title, text, anchors, noindex = true }
) {
  const canonical = site ? new URL(target, site).href : target;
  const script = anchors
    ? anchorScript(target, anchors)
    : `location.replace(${scriptLiteral(target)} + location.search + location.hash);`;
  const robots = noindex ? '\n<meta name="robots" content="noindex">' : '';
  return `<!doctype html>
<html lang="en" ${REDIRECT_MARKER}>
<head>
<meta charset="utf-8">
<title>${title}</title>${robots}
<link rel="canonical" href="${canonical}">
<script>${script}</script>
<meta http-equiv="refresh" content="0; url=${target}">
</head>
<body>
<p>${text} <a href="${target}">${canonical}</a>.</p>
</body>
</html>
`;
}

/**
 * The redirect page of a moved page.
 * @param {string} path a key of `MOVED_PAGES`
 * @param {{ base: string, site?: string }} options
 */
export const movedPage = (path, { base, site }) =>
  redirectHtml(withBase(base, MOVED_PAGES[path]), {
    site,
    title: 'Page moved',
    text: 'This page moved to'
  });

/**
 * The file a moved page's redirect is written to, relative to the output.
 * @param {string} path
 */
export const movedFile = path => `${path.replace(/\/?$/, '/')}index.html`;

/**
 * Writes the redirect pages of `MOVED_PAGES`. A moved page that the site
 * still builds fails the build: the redirect would hide it.
 * @returns {import('astro').AstroIntegration}
 */
export function movedPages() {
  /** @type {{ base: string, site?: string }} */
  let options = { base: '/' };
  return {
    name: 'moved-pages',
    hooks: {
      'astro:config:done': ({ config }) => {
        options = { base: config.base, site: config.site };
      },
      'astro:build:done': async ({ dir, logger }) => {
        const out = fileURLToPath(dir);
        for (const path of Object.keys(MOVED_PAGES)) {
          const file = join(out, movedFile(path));
          if (await exists(file)) {
            throw new Error(
              `${path} is listed as moved, but the site still has a page there.`
            );
          }
          await mkdir(dirname(file), { recursive: true });
          await writeFile(file, movedPage(path, options));
        }
        logger.info(
          `Redirected ${Object.keys(MOVED_PAGES).length} moved pages.`
        );
      }
    }
  };
}

/**
 * Whether `file` is a file.
 * @param {string} file
 */
export async function exists(file) {
  try {
    return (await stat(file)).isFile();
  } catch {
    return false;
  }
}
