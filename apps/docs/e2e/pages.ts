/** The pages the e2e tests open: one of each kind, every docs and API page. */
import { readdir } from 'node:fs/promises';
import { API_PAGES } from '../src/lib/api-pages';

/** Every docs page, from the content folder, so new pages are tested too. */
export const DOCS = (
  await readdir(new URL('../src/content/docs/', import.meta.url))
)
  .filter(file => file.endsWith('.mdx'))
  .map(file => file.slice(0, -'.mdx'.length))
  .sort();

export const PAGES = [
  { name: 'home', path: '/' },
  ...DOCS.map(slug => ({ name: `docs/${slug}`, path: `/docs/${slug}/` })),
  { name: 'examples', path: '/examples/' },
  { name: 'plugins', path: '/plugins/' },
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
