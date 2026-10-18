import type { ChartConfig } from './types';

/**
 * The root attribute of markup from `renderForHydration()` (in
 * `chartist/server`) that records the layout the server used, as JSON.
 * `chart()` removes it once it laid the chart out at the real size.
 */
export const HYDRATION_ATTRIBUTE = 'data-ct-hydrate';

/**
 * The root's size attributes `chart()` draws; `renderForHydration()` gives
 * the server's root the same, so both sides draw the same root.
 */
export const chartRootSize = (config: ChartConfig) => ({
  width: config.width ?? '100%',
  height: config.height ?? '100%'
});
