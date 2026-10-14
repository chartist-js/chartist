import { getCollection, type CollectionEntry } from 'astro:content';
import { GROUPS } from '../content.config';
import { API_PAGES } from './api-pages';
import { EDIT_BASE } from './site';

export type DocEntry = CollectionEntry<'docs'>;

/** The API reference's sidebar groups. */
const API_GROUPS = ['Reference', 'Functional API', '1.x'] as const;
/** Sidebar groups: the docs' content groups, then the API reference's. */
export const NAV_GROUPS = [...GROUPS, ...API_GROUPS] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];
/** The header sections with a sidebar. */
export type NavSection = 'docs' | 'api';

/** A page in the docs navigation: a content page or an API page. */
export interface NavPage {
  /** Unique: the content id, or `api/<slug>`. */
  key: string;
  /** Site path, e.g. `docs/getting-started/`. */
  path: string;
  title: string;
  /** Sidebar label. */
  label: string;
  description: string;
  group: NavGroup;
  section: NavSection;
  /** Where to edit it on GitHub; API pages are generated. */
  editUrl?: string;
}

/** All docs pages in sidebar order: by group, then by `order`. */
export async function sortedDocs(): Promise<DocEntry[]> {
  const docs = await getCollection('docs');
  return docs.sort(
    (a, b) =>
      GROUPS.indexOf(a.data.group) - GROUPS.indexOf(b.data.group) ||
      a.data.order - b.data.order
  );
}

export const docPath = (doc: DocEntry) => `docs/${doc.id}/`;

const fromDoc = (doc: DocEntry): NavPage => ({
  key: doc.id,
  path: docPath(doc),
  title: doc.data.title,
  label: doc.data.label ?? doc.data.title,
  description: doc.data.description,
  group: doc.data.group,
  section: 'docs',
  editUrl: `${EDIT_BASE}${doc.filePath?.split('/content/docs/')[1] ?? ''}`
});

/** The API reference's overview page. */
export const API_OVERVIEW: NavPage = {
  key: 'api',
  path: 'api/',
  title: 'API reference',
  label: 'Overview',
  description:
    'Every function and type Chartist exports, generated from its TypeScript source.',
  group: 'Reference',
  section: 'api'
};

/** The pages of a section's sidebar, in order. */
export async function navPages(section: NavSection): Promise<NavPage[]> {
  if (section === 'docs') {
    return (await sortedDocs()).map(fromDoc);
  }
  const api = API_PAGES.map((page): NavPage => ({
    key: `api/${page.slug}`,
    path: `api/${page.slug}/`,
    title: page.title,
    label: page.title,
    description: page.description,
    group: page.legacy ? '1.x' : 'Functional API',
    section: 'api'
  }));
  return [API_OVERVIEW, ...api];
}

/** The sidebar: groups with their pages, empty groups left out. */
export function sidebar(pages: NavPage[]) {
  return NAV_GROUPS.map(group => ({
    group,
    pages: pages.filter(page => page.group === group)
  })).filter(entry => entry.pages.length > 0);
}
