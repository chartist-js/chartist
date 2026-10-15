import type { SegmentData } from '../core/types';
import { getMultiValue } from '../core';
import { SvgPath } from '../svg';

/** The options of {@link Interpolation.simple}. */
export interface SimpleInteractionOptions {
  /**
   * How long the curve's handles are: the distance between two points
   * divided by this, so larger values give tighter curves. `2` by default,
   * at least `1`.
   */
  divisor?: number;
  /**
   * Joins the line across holes (`null` or `undefined` values) instead of
   * breaking it. Off by default.
   */
  fillHoles?: boolean;
}

/**
 * Smooths a line with curves whose handles are horizontal: it goes through
 * every point and never swings above or below them, but flows less than
 * {@link Interpolation.cardinal}. `divisor` sets how round it is.
 *
 * @example
 * ```ts
 * import { lineChart, Interpolation } from 'chartist';
 *
 * lineChart(
 *   '#chart',
 *   { labels: [1, 2, 3, 4, 5], series: [[1, 2, 8, 1, 7]] },
 *   { lineSmooth: Interpolation.simple({ divisor: 3 }) }
 * );
 * ```
 *
 * @param options The divisor, and whether to join the line across holes.
 * @returns The interpolation, for the `lineSmooth` option.
 */
export function simple(options?: SimpleInteractionOptions) {
  const finalOptions = {
    divisor: 2,
    fillHoles: false,
    ...options
  };

  const d = 1 / Math.max(1, finalOptions.divisor);

  return function simpleInterpolation(
    pathCoordinates: number[],
    valueData: SegmentData[]
  ) {
    const path = new SvgPath();
    let prevX = 0;
    let prevY = 0;
    let prevData;

    for (let i = 0; i < pathCoordinates.length; i += 2) {
      const currX = pathCoordinates[i];
      const currY = pathCoordinates[i + 1];
      const length = (currX - prevX) * d;
      const currData = valueData[i / 2];

      if (getMultiValue(currData.value) !== undefined) {
        if (prevData === undefined) {
          path.move(currX, currY, false, currData);
        } else {
          path.curve(
            prevX + length,
            prevY,
            currX - length,
            currY,
            currX,
            currY,
            false,
            currData
          );
        }

        prevX = currX;
        prevY = currY;
        prevData = currData;
      } else if (!finalOptions.fillHoles) {
        prevX = prevY = 0;
        prevData = undefined;
      }
    }

    return path;
  };
}
