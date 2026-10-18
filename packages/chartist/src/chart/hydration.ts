import type { LabelMode } from '../render/measure';
import type { ChartConfig } from './types';

/**
 * What `renderForHydration()` records on the root for the browser to build
 * the same scene again.
 */
export interface HydrationMarker {
  /** The marker's version; others aren't taken over. */
  readonly v: 1;
  /** The layout size in px. */
  readonly width: number;
  readonly height: number;
  /** The label mode the scene was laid out with. */
  readonly labels: LabelMode;
  /** `estimate` for the built-in estimate, `custom` for a `measureText`. */
  readonly text: 'estimate' | 'custom';
  /** Whether the root got a `viewBox` that only scales until hydration. */
  readonly scale: boolean;
}

/** The root attribute that carries the {@link HydrationMarker} as JSON. */
export const HYDRATION_ATTRIBUTE = 'data-ct-hydrate';

/** The root's size attributes `chart()` draws, so both sides draw the same root. */
export const chartRootSize = (config: ChartConfig) => ({
  width: config.width ?? '100%',
  height: config.height ?? '100%'
});

/** The root attributes the marker stands for, besides the marker itself. */
export const markedRoot = (marker: HydrationMarker) =>
  marker.scale ? { viewBox: `0 0 ${marker.width} ${marker.height}` } : {};
