import type { SegmentData } from '../core';
import { getMultiValue } from '../core';
import { SvgPath } from '../svg';

export interface NoneInterpolationOptions {
  fillHoles?: boolean;
}

/**
 * This interpolation function does not smooth the path and the result is only containing lines and no curves.
 *
 * @example
 * const chart = new LineChart('.ct-chart', {
 *   labels: [1, 2, 3, 4, 5],
 *   series: [[1, 2, 8, 1, 7]]
 * }, {
 *   lineSmooth: Interpolation.none({
 *     fillHoles: false
 *   })
 * });
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
