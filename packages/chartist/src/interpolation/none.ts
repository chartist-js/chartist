import type { SegmentData } from '../core';
import { getMultiValue } from '../core';
import { SvgPath } from '../svg';

/** The options of {@link Interpolation.none}. */
export interface NoneInterpolationOptions {
  /**
   * Joins the line across holes (`null` or `undefined` values) instead of
   * breaking it. Off by default.
   */
  fillHoles?: boolean;
}

/**
 * Draws a line as straight segments from point to point, without
 * smoothing. It's what `lineSmooth: false` uses.
 *
 * @example
 * ```ts
 * import { lineChart, Interpolation } from 'chartist';
 *
 * lineChart(
 *   '#chart',
 *   { labels: [1, 2, 3, 4, 5], series: [[1, 2, 8, 1, 7]] },
 *   { lineSmooth: Interpolation.none({ fillHoles: true }) }
 * );
 * ```
 *
 * @param options Whether to join the line across holes.
 * @returns The interpolation, for the `lineSmooth` option.
 */
export function none(options?: NoneInterpolationOptions) {
  const finalOptions = {
    fillHoles: false,
    ...options
  };

  return function noneInterpolation(
    pathCoordinates: number[],
    valueData: SegmentData[]
  ) {
    const path = new SvgPath();
    let hole = true;

    for (let i = 0; i < pathCoordinates.length; i += 2) {
      const currX = pathCoordinates[i];
      const currY = pathCoordinates[i + 1];
      const currData = valueData[i / 2];

      if (getMultiValue(currData.value) !== undefined) {
        if (hole) {
          path.move(currX, currY, false, currData);
        } else {
          path.line(currX, currY, false, currData);
        }

        hole = false;
      } else if (!finalOptions.fillHoles) {
        hole = true;
      }
    }

    return path;
  };
}
