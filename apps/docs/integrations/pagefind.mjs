/**
 * Site search (polish-docs-site, design D1): indexes the built site with
 * Pagefind after the build, and serves the last build's index in dev.
 */

/** @returns {import('astro').AstroIntegration} */
export function pagefind() {
  return {
    name: 'pagefind',
    hooks: {}
  };
}
