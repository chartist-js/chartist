/**
 * The changelog of the released packages (`chartist` and the
 * `@chartist-js` packages, released together): Nx's default renderer,
 * without the commits of the docs site, the playground, the examples and
 * the specs. Their scopes say so; they ship with the site, not in a
 * package.
 */
const DefaultChangelogRenderer =
  require('nx/release/changelog-renderer').default;

const SITE_SCOPES = new Set(['docs', 'playground', 'examples', 'openspec']);

module.exports = class ChartistChangelogRenderer extends (
  DefaultChangelogRenderer
) {
  filterChanges(changes, project) {
    return super
      .filterChanges(changes, project)
      .filter(change => !SITE_SCOPES.has(change.scope));
  }
};
