/**
 * `chartist/live`: live updates. A renderer that keeps a chart's SVG and
 * changes it in place on every update, the keyed diff it uses, and SMIL
 * update animations. Opt in per chart with `renderer: liveDomRenderer()`.
 *
 * This entry imports only the package root (`../index`), so its builds
 * use the core instead of bundling a copy.
 *
 * @experimental The v2 API may change until v2.0.
 */
export { smilAnimations } from './animations';
export { diffScenes } from './diff';
export { liveDomRenderer } from './renderer';
export type {
  DiffOptions,
  LiveAnimationContext,
  LiveAnimations,
  LiveDomRendererOptions,
  ValueKey,
  ValueKeyContext
} from './types';
