import type { SegmentData } from '../core';
import { splitIntoSegments } from '../core';
import { SvgPath } from '../svg';
import { none } from './none';

export interface MonotoneCubicInterpolationOptions {
  fillHoles?: boolean;
}

/**
 * Monotone Cubic spline interpolation produces a smooth curve which preserves monotonicity. Unlike cardinal splines, the curve will not extend beyond the range of y-values of the original data points.
 *
 * Monotone Cubic splines can only be created if there are more than two data points. If this is not the case this smoothing will fallback to `Chartist.Smoothing.none`.
 *
 * The x-values of subsequent points must be increasing to fit a Monotone Cubic spline. If this condition is not met for a pair of adjacent points, then there will be a break in the curve between those data points.
 *
 * All smoothing functions within Chartist are factory functions that accept an options parameter.
 *
 * @example
 * const chart = new LineChart('.ct-chart', {
 *   labels: [1, 2, 3, 4, 5],
 *   series: [[1, 2, 8, 1, 7]]
 * }, {
 *   lineSmooth: Interpolation.monotoneCubic({
 *     fillHoles: false
 *   })
 * });
 *
 * @param options The options of the monotoneCubic factory function.
 */
export function monotoneCubic(options?: MonotoneCubicInterpolationOptions) {
  const finalOptions = {
    fillHoles: false,
    ...options
  };

  return function monotoneCubicInterpolation(
    pathCoordinates: number[],
    valueData: SegmentData[]
  ): SvgPath {
    // First we try to split the coordinates into segments
    // This is necessary to treat "holes" in line charts
    const segments = splitIntoSegments(pathCoordinates, valueData, {
      fillHoles: finalOptions.fillHoles,
      increasingX: true
    });

    if (!segments.length) {
      // If there were no segments return 'Chartist.Interpolation.none'
      return none()([], []);
    } else if (segments.length > 1) {
      // If the split resulted in more that one segment we need to interpolate each segment individually and join them
      // afterwards together into a single path.
      // For each segment we will recurse the monotoneCubic fn function
      // Join the segment path data into a single path and return
      return SvgPath.join(
        segments.map(segment =>
          monotoneCubicInterpolation(segment.pathCoordinates, segment.valueData)
        )
      );
    } else {
      // If there was only one segment we can proceed regularly by using pathCoordinates and valueData from the first
      // segment
      pathCoordinates = segments[0].pathCoordinates;
      valueData = segments[0].valueData;

      // If less than three points we need to fallback to no smoothing
      if (pathCoordinates.length <= 4) {
        return none()(pathCoordinates, valueData);
      }

      const xs = [];
      const ys = [];
      const n = pathCoordinates.length / 2;
      const ms = [];
      const ds = [];
      const dys = [];
      const dxs = [];

      // Populate x and y coordinates into separate arrays, for readability
      for (let i = 0; i < n; i++) {
        xs[i] = pathCoordinates[i * 2];
        ys[i] = pathCoordinates[i * 2 + 1];
      }

      // Calculate deltas and derivative
      for (let i = 0; i < n - 1; i++) {
        dys[i] = ys[i + 1] - ys[i];
        dxs[i] = xs[i + 1] - xs[i];
        ds[i] = dys[i] / dxs[i];
      }

      // Determine desired slope (m) at each point using Fritsch-Carlson method
      // See: http://math.stackexchange.com/questions/45218/implementation-of-monotone-cubic-interpolation
      ms[0] = ds[0];
      ms[n - 1] = ds[n - 2];

      for (let i = 1; i < n - 1; i++) {
        if (ds[i] === 0 || ds[i - 1] === 0 || ds[i - 1] > 0 !== ds[i] > 0) {
          ms[i] = 0;
        } else {
          ms[i] =
            (3 * (dxs[i - 1] + dxs[i])) /
            ((2 * dxs[i] + dxs[i - 1]) / ds[i - 1] +
              (dxs[i] + 2 * dxs[i - 1]) / ds[i]);

          if (!isFinite(ms[i])) {
            ms[i] = 0;
          }
        }
      }

      // Now build a path from the slopes
      const path = new SvgPath().move(xs[0], ys[0], false, valueData[0]);

      for (let i = 0; i < n - 1; i++) {
        path.curve(
          // First control point
          xs[i] + dxs[i] / 3,
          ys[i] + (ms[i] * dxs[i]) / 3,
          // Second control point
          xs[i + 1] - dxs[i] / 3,
          ys[i + 1] - (ms[i + 1] * dxs[i]) / 3,
          // End point
          xs[i + 1],
          ys[i + 1],

          false,
          valueData[i + 1]
        );
      }

      return path;
    }
  };
}
