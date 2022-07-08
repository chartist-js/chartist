import type { SegmentData } from '../core';
import { splitIntoSegments } from '../core';
import { SvgPath } from '../svg';
import { none } from './none';

export interface CardinalInterpolationOptions {
  tension?: number;
  fillHoles?: boolean;
}

/**
 * Cardinal / Catmull-Rome spline interpolation is the default smoothing function in Chartist. It produces nice results where the splines will always meet the points. It produces some artifacts though when data values are increased or decreased rapidly. The line may not follow a very accurate path and if the line should be accurate this smoothing function does not produce the best results.
 *
 * Cardinal splines can only be created if there are more than two data points. If this is not the case this smoothing will fallback to `Chartist.Smoothing.none`.
 *
 * All smoothing functions within Chartist are factory functions that accept an options parameter. The cardinal interpolation function accepts one configuration parameter `tension`, between 0 and 1, which controls the smoothing intensity.
 *
 * @example
 * const chart = new LineChart('.ct-chart', {
 *   labels: [1, 2, 3, 4, 5],
 *   series: [[1, 2, 8, 1, 7]]
 * }, {
 *   lineSmooth: Interpolation.cardinal({
 *     tension: 1,
 *     fillHoles: false
 *   })
 * });
 *
 * @param options The options of the cardinal factory function.
 */
export function cardinal(options?: CardinalInterpolationOptions) {
  const finalOptions = {
    tension: 1,
    fillHoles: false,
    ...options
  };

  const t = Math.min(1, Math.max(0, finalOptions.tension));
  const c = 1 - t;

  return function cardinalInterpolation(
    pathCoordinates: number[],
    valueData: SegmentData[]
  ): SvgPath {
    // First we try to split the coordinates into segments
    // This is necessary to treat "holes" in line charts
    const segments = splitIntoSegments(pathCoordinates, valueData, {
      fillHoles: finalOptions.fillHoles
    });

    if (!segments.length) {
      // If there were no segments return 'none' interpolation
      return none()([], []);
    } else if (segments.length > 1) {
      // If the split resulted in more that one segment we need to interpolate each segment individually and join them
      // afterwards together into a single path.
      // For each segment we will recurse the cardinal function
      // Join the segment path data into a single path and return
      return SvgPath.join(
        segments.map(segment =>
          cardinalInterpolation(segment.pathCoordinates, segment.valueData)
        )
      );
    } else {
      // If there was only one segment we can proceed regularly by using pathCoordinates and valueData from the first
      // segment
      pathCoordinates = segments[0].pathCoordinates;
      valueData = segments[0].valueData;

      // If less than two points we need to fallback to no smoothing
      if (pathCoordinates.length <= 4) {
        return none()(pathCoordinates, valueData);
      }

      const path = new SvgPath().move(
        pathCoordinates[0],
        pathCoordinates[1],
        false,
        valueData[0]
      );
      const z = false;

      for (
        let i = 0, iLen = pathCoordinates.length;
        iLen - 2 * Number(!z) > i;
        i += 2
      ) {
        const p = [
          { x: +pathCoordinates[i - 2], y: +pathCoordinates[i - 1] },
          { x: +pathCoordinates[i], y: +pathCoordinates[i + 1] },
          { x: +pathCoordinates[i + 2], y: +pathCoordinates[i + 3] },
          { x: +pathCoordinates[i + 4], y: +pathCoordinates[i + 5] }
        ];

        if (z) {
          if (!i) {
            p[0] = {
              x: +pathCoordinates[iLen - 2],
              y: +pathCoordinates[iLen - 1]
            };
          } else if (iLen - 4 === i) {
            p[3] = { x: +pathCoordinates[0], y: +pathCoordinates[1] };
          } else if (iLen - 2 === i) {
            p[2] = { x: +pathCoordinates[0], y: +pathCoordinates[1] };
            p[3] = { x: +pathCoordinates[2], y: +pathCoordinates[3] };
          }
        } else {
          if (iLen - 4 === i) {
            p[3] = p[2];
          } else if (!i) {
            p[0] = { x: +pathCoordinates[i], y: +pathCoordinates[i + 1] };
          }
        }

        path.curve(
          (t * (-p[0].x + 6 * p[1].x + p[2].x)) / 6 + c * p[2].x,
          (t * (-p[0].y + 6 * p[1].y + p[2].y)) / 6 + c * p[2].y,
          (t * (p[1].x + 6 * p[2].x - p[3].x)) / 6 + c * p[2].x,
          (t * (p[1].y + 6 * p[2].y - p[3].y)) / 6 + c * p[2].y,
          p[2].x,
          p[2].y,
          false,
          valueData[(i + 2) / 2]
        );
      }

      return path;
    }
  };
}
