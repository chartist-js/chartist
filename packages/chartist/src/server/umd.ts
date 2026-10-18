/**
 * The exports `chartist/server` adds to the core: the whole UMD build,
 * since the global `Chartist` already has `toScene()`. Re-exporting it
 * there would replace the core's function with a getter that reads itself.
 */
export { applyStyles, computeStyles } from './applyStyles';
export type {
  ApplyStylesOptions,
  ComputedStyles,
  ComputeStylesOptions,
  SkippedStyle
} from './applyStyles';
export type { SkipReason } from './css';
export { renderForHydration } from './renderForHydration';
export { renderToString } from './string';
