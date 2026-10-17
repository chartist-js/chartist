import { getCollection, type CollectionEntry } from 'astro:content';
import { GROUPS } from '../content.config';
import { packageBySlug } from '../data/packages';
import { API_PAGES } from './api-pages';
import { EDIT_CONTENT } from './site';

export type DocEntry = CollectionEntry<'docs'>;
export type PackageEntry = CollectionEntry<'packages'>;

/** The API reference's sidebar groups. */
const API_GROUPS = ['Reference', 'Functional API', '1.x'] as const;
/**
 * Sidebar groups: a package's overview, the docs' content groups, the
 * package guides, then the API reference's. Package subsites use Package,
 * Guides and Reference.
 */
export const NAV_GROUPS = [
  'Package',
  ...GROUPS,
  'Guides',
  ...API_GROUPS
] as const;
export type NavGroup = (typeof NAV_GROUPS)[number];
/** The header sections with a sidebar. */
export type NavSection = 'docs' | 'api' | 'packages';

/** What a section's pages call it: breadcrumb, menus and search filter. */
export const SECTION_LABELS: Readonly<Record<NavSection, string>> = {
  docs: 'Docs',
  api: 'API',
  packages: 'Packages'
};

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
  /** The package's slug, for package pages. */
  pkg?: string;
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
  editUrl: editUrl(doc)
});

/** The GitHub edit link of a content entry. */
const editUrl = (entry: DocEntry | PackageEntry) =>
  `${EDIT_CONTENT}${entry.filePath?.split('/content/')[1] ?? ''}`;

/** A package page's file name without `.mdx`: `index` or the guide's name. */
const pageName = (entry: PackageEntry) =>
  (entry.filePath ?? entry.id)
    .split('/')
    .pop()!
    .replace(/\.mdx$/, '');

/** The package a package page belongs to: its folder. */
const packageOf = (entry: PackageEntry) =>
  (entry.filePath ?? entry.id).split('/').slice(-2)[0];

/** A package's overview and guides, in order. */
export async function packageEntries(slug: string): Promise<PackageEntry[]> {
  packageBySlug(slug);
  const entries = (await getCollection('packages')).filter(
    entry => packageOf(entry) === slug
  );
  for (const entry of entries) {
    if (pageName(entry) === 'api') {
      throw new Error(
        `${entry.filePath}: "api" is the package's API page; name the guide differently`
      );
    }
  }
  if (!entries.some(entry => pageName(entry) === 'index')) {
    throw new Error(`The package "${slug}" has no index.mdx`);
  }
  return entries.sort((a, b) => a.data.order - b.data.order);
}

/** The path of a package page: the overview at the package's root. */
export const packagePagePath = (slug: string, name: string) =>
  name === 'index' ? `packages/${slug}/` : `packages/${slug}/${name}/`;

/** The name of a package page in its URL: `undefined` for the overview. */
export const packagePageParam = (entry: PackageEntry) => {
  const name = pageName(entry);
  return name === 'index' ? undefined : name;
};

/** A package's subsite pages: overview, guides in order, API page. */
async function packageNav(slug: string): Promise<NavPage[]> {
  const pkg = packageBySlug(slug);
  const pages = (await packageEntries(slug)).map((entry): NavPage => {
    const name = pageName(entry);
    return {
      key: `${slug}/${name}`,
      path: packagePagePath(slug, name),
      title: entry.data.title,
      label: entry.data.label ?? entry.data.title,
      description: entry.data.description,
      group: name === 'index' ? 'Package' : 'Guides',
      section: 'packages',
      pkg: slug,
      editUrl: editUrl(entry)
    };
  });
  return [
    ...pages,
    {
      key: `${slug}/api`,
      path: `packages/${slug}/api/`,
      title: `${pkg.name} API`,
      label: 'API',
      description: `Every function and type ${pkg.name} exports, generated from its TypeScript source.`,
      group: 'Reference',
      section: 'packages',
      pkg: slug
    }
  ];
}

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

/**
 * The pages of a section's sidebar, in order; for packages, the pages of
 * one package's subsite.
 */
export async function navPages(
  section: NavSection,
  pkg?: string
): Promise<NavPage[]> {
  if (section === 'packages') {
    if (!pkg) {
      throw new Error('Package pages need their package');
    }
    return packageNav(pkg);
  }
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
