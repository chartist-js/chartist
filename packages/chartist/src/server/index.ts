/**
 * `chartist/server`: charts to markup without a DOM, for Node.js, server
 * bundles and workers, and for exporting a chart in the browser.
 * `toScene()` lays a chart out and comes from `chartist`; it's re-exported
 * here, so server code needs one import.
 *
 * This entry imports only the package root (`../index`), so its builds
 * use the core instead of bundling a copy.
 */
export { toScene } from '../index';
export type { SceneSize } from '../index';
export * from './umd';
