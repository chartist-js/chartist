import {extend, splitIntoSegments} from '../core/core';
import {SvgPath} from '../svg/svg-path';
import {none} from './none';

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
 * var chart = new Chartist.Line('.ct-chart', {
   *   labels: [1, 2, 3, 4, 5],
   *   series: [[1, 2, 8, 1, 7]]
   * }, {
   *   lineSmooth: Chartist.Interpolation.monotoneCubic({
   *     fillHoles: false
   *   })
   * });
 *
 * @memberof Chartist.Interpolation
 * @param {Object} [options] The options of the monotoneCubic factory function.
 * @return {Function}
 */
export function monotoneCubic(options) {
  var defaultOptions = {
    fillHoles: false
  };

  options = extend({}, defaultOptions, options);

  return function monotoneCubic(pathCoordinates, valueData) {
    // First we try to split the coordinates into segments
    // This is necessary to treat "holes" in line charts
    var segments = splitIntoSegments(pathCoordinates, valueData, {
      fillHoles: options.fillHoles,
      increasingX: true
    });

    if(!segments.length) {
      // If there were no segments return 'Chartist.Interpolation.none'
      return none()([]);
    } else if(segments.length > 1) {
      // If the split resulted in more that one segment we need to interpolate each segment individually and join them
      // afterwards together into a single path.
      var paths = [];
      // For each segment we will recurse the monotoneCubic fn function
      segments.forEach(function(segment) {
        paths.push(monotoneCubic(segment.pathCoordinates, segment.valueData));
      });
      // Join the segment path data into a single path and return
      return SvgPath.join(paths);
    } else {
      // If there was only one segment we can proceed regularly by using pathCoordinates and valueData from the first
      // segment
      pathCoordinates = segments[0].pathCoordinates;
      valueData = segments[0].valueData;

      // If less than three points we need to fallback to no smoothing
      if(pathCoordinates.length <= 4) {
        return none()(pathCoordinates, valueData);
      }

      var xs = [],
        ys = [],
        i,
        n = pathCoordinates.length / 2,
        ms = [],
        ds = [], dys = [], dxs = [],
        path;

      // Populate x and y coordinates into separate arrays, for readability

      for(i = 0; i < n; i++) {
        xs[i] = pathCoordinates[i * 2];
        ys[i] = pathCoordinates[i * 2 + 1];
      }

      // Calculate deltas and derivative

      for(i = 0; i < n - 1; i++) {
        dys[i] = ys[i + 1] - ys[i];
        dxs[i] = xs[i + 1] - xs[i];
        ds[i] = dys[i] / dxs[i];
      }

      // Determine desired slope (m) at each point using Fritsch-Carlson method
      // See: http://math.stackexchange.com/questions/45218/implementation-of-monotone-cubic-interpolation

      ms[0] = ds[0];
      ms[n - 1] = ds[n - 2];

      for(i = 1; i < n - 1; i++) {
        if(ds[i] === 0 || ds[i - 1] === 0 || (ds[i - 1] > 0) !== (ds[i] > 0)) {
          ms[i] = 0;
        } else {
          ms[i] = 3 * (dxs[i - 1] + dxs[i]) / (
            (2 * dxs[i] + dxs[i - 1]) / ds[i - 1] +
            (dxs[i] + 2 * dxs[i - 1]) / ds[i]);

          if(!isFinite(ms[i])) {
            ms[i] = 0;
          }
        }
      }

      // Now build a path from the slopes

      path = new SvgPath().move(xs[0], ys[0], false, valueData[0]);

      for(i = 0; i < n - 1; i++) {
        path.curve(
          // First control point
          xs[i] + dxs[i] / 3,
          ys[i] + ms[i] * dxs[i] / 3,
          // Second control point
          xs[i + 1] - dxs[i] / 3,
          ys[i + 1] - ms[i + 1] * dxs[i] / 3,
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
