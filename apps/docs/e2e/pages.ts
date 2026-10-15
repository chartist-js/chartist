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
