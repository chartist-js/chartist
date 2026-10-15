/** Site-wide links and settings. */
export const REPO = 'https://github.com/chartist-js/chartist';
/**
 * Where the site's content is edited on GitHub (`docs/…` or `packages/…`
 * below). Docs sources live on the `next` branch until the v2 release.
 */
export const EDIT_CONTENT = `${REPO}/edit/next/apps/docs/src/content/`;

/**
 * Documentation versions, for the docs' version switcher and the footer. The
 * 1.x docs are static files on this site (`public/v1/`), the 0.x docs stay
 * on GitHub Pages.
 */
export const VERSIONS = [
  { label: 'v2 (current)', href: null },
  { label: 'v1.5 docs', href: href('v1/') },
  { label: 'v0.11 archive', href: 'https://gionkunz.github.io/chartist-js/' }
] as const;

/** Header navigation. Sections appear as their changes land. */
export const NAV = [
  { id: 'docs', label: 'Docs', path: 'docs/getting-started/' },
  { id: 'api', label: 'API', path: 'api/' },
  { id: 'packages', label: 'Packages', path: 'packages/' },
  { id: 'examples', label: 'Examples', path: 'examples/' },
  { id: 'plugins', label: 'Plugins', path: 'plugins/' },
  { id: 'playground', label: 'Playground', path: 'playground/' },
  { id: 'credits', label: 'Credits', path: 'credits/' }
] as const;

/** Joins a site path to the configured base. */
export function href(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  return `${base}/${path.replace(/^\//, '')}`;
}
