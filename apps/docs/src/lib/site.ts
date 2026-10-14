/** Site-wide links and settings. */
export const REPO = 'https://github.com/chartist-js/chartist';
/** Docs sources live on the `next` branch until the v2 release. */
export const EDIT_BASE = `${REPO}/edit/next/apps/docs/src/content/docs/`;

export const VERSIONS = [
  { label: 'v2 (current)', href: null },
  { label: 'v1.5 docs', href: 'https://chartist.dev/' },
  { label: 'v0.11 archive', href: 'https://gionkunz.github.io/chartist-js/' }
] as const;

/** Header navigation. Sections appear as their changes land. */
export const NAV = [
  { id: 'docs', label: 'Docs', path: 'docs/getting-started/' },
  { id: 'examples', label: 'Examples', path: 'examples/' },
  { id: 'playground', label: 'Playground', path: 'playground/' }
] as const;

/** Joins a site path to the configured base. */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
