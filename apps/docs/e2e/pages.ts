/** The pages the e2e tests open: one of each kind, every docs, API and package page. */
import { readdir } from 'node:fs/promises';
import { API_PAGES } from '../src/lib/api-pages';

/** Every docs page, from the content folder, so new pages are tested too. */
export const DOCS = (
  await readdir(new URL('../src/content/docs/', import.meta.url))
)
  .filter(file => file.endsWith('.mdx'))
  .map(file => file.slice(0, -'.mdx'.length))
  .sort();

/**
 * Every package subsite page, from the content folders: each package's
 * overview, guides and API page. Overview and guides have live examples.
 */
const packagesDir = new URL('../src/content/packages/', import.meta.url);
export const PACKAGE_GUIDES: string[] = [];
export const PACKAGE_PAGES: string[] = [];
for (const slug of (await readdir(packagesDir)).sort()) {
  const files = (await readdir(new URL(`${slug}/`, packagesDir)))
    .filter(file => file.endsWith('.mdx'))
    .map(file => file.slice(0, -'.mdx'.length))
    .sort();
  const paths = files.map(name =>
    name === 'index' ? `/packages/${slug}/` : `/packages/${slug}/${name}/`
  );
  PACKAGE_GUIDES.push(...paths);
  PACKAGE_PAGES.push(...paths, `/packages/${slug}/api/`);
}

export const PAGES = [
  { name: 'home', path: '/' },
  ...DOCS.map(slug => ({ name: `docs/${slug}`, path: `/docs/${slug}/` })),
  { name: 'packages', path: '/packages/' },
  ...PACKAGE_PAGES.map(path => ({ name: path.slice(1, -1), path })),
  { name: 'examples', path: '/examples/' },
  { name: 'plugins', path: '/plugins/' },
  { name: 'plugin page', path: '/plugins/chartist-plugin-legend/' },
  { name: 'example page', path: '/examples/line/modify-drawing/' },
  { name: 'playground', path: '/playground/' },
  { name: 'api', path: '/api/' },
  ...API_PAGES.map(page => ({
    name: `api/${page.slug}`,
    path: `/api/${page.slug}/`
  })),
  { name: 'credits', path: '/credits/' },
  { name: '404', path: '/no-such-page/' }
];

/**
 * The pages the accessibility scan opens on every run: one per template,
 * plus pages with components of their own. Pages of one template share
 * their components and color tokens, so one of them finds what all of
 * them would. E2E_A11Y=all scans every page, as the release does.
 */
const A11Y_TEMPLATES = new Set([
  'home',
  'docs/getting-started',
  'docs/composed-charts',
  'packages',
  'packages/terminal',
  'packages/terminal/api',
  'examples',
  'example page',
  'plugins',
  'plugin page',
  'playground',
  'api',
  'api/layers',
  'credits',
  '404'
]);

export const A11Y_PAGES =
  process.env.E2E_A11Y === 'all'
    ? PAGES
    : PAGES.filter(page => A11Y_TEMPLATES.has(page.name));
