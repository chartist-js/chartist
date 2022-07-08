import type { SegmentData } from '../core/types';
import { SvgPath } from '../svg';

export interface SimpleInteractionOptions {
  divisor?: number;
  fillHoles?: boolean;
}

/**
 * Simple smoothing creates horizontal handles that are positioned with a fraction of the length between two data points. You can use the divisor option to specify the amount of smoothing.
 *
 * Simple smoothing can be used instead of `Chartist.Smoothing.cardinal` if you'd like to get rid of the artifacts it produces sometimes. Simple smoothing produces less flowing lines but is accurate by hitting the points and it also doesn't swing below or above the given data point.
 *
 * All smoothing functions within Chartist are factory functions that accept an options parameter. The simple interpolation function accepts one configuration parameter `divisor`, between 1 and ∞, which controls the smoothing characteristics.
 *
 * @example
 * const chart = new LineChart('.ct-chart', {
 *   labels: [1, 2, 3, 4, 5],
 *   series: [[1, 2, 8, 1, 7]]
 * }, {
 *   lineSmooth: Interpolation.simple({
 *     divisor: 2,
 *     fillHoles: false
 *   })
 * });
 *
 * @param options The options of the simple interpolation factory function.
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

      if (currData.value !== undefined) {
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
