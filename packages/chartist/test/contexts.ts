import type { PointContext, SeriesGroupContext } from '../src/scene/roles';

/** A point context with defaults, for tests that build nodes by hand. */
export function pointContext(
  overrides: Partial<PointContext> = {}
): PointContext {
  return {
    series: [],
    seriesIndex: 0,
    meta: undefined,
    valueIndex: 0,
    value: 0,
    x: 0,
    y: 0,
    ...overrides
  };
}

/** A series context with defaults, for tests that build nodes by hand. */
export function seriesContext(
  overrides: Partial<SeriesGroupContext> = {}
): SeriesGroupContext {
  return { series: [], seriesIndex: 0, meta: undefined, ...overrides };
}
