import {extend} from '../core/core';
import {SvgPath} from '../svg/svg-path';

/**
 * Step interpolation will cause the line chart to move in steps rather than diagonal or smoothed lines. This interpolation will create additional points that will also be drawn when the `showPoint` option is enabled.
 *
 * All smoothing functions within Chartist are factory functions that accept an options parameter. The step interpolation function accepts one configuration parameter `postpone`, that can be `true` or `false`. The default value is `true` and will cause the step to occur where the value actually changes. If a different behaviour is needed where the step is shifted to the left and happens before the actual value, this option can be set to `false`.
 *
 * @example
 * var chart = new Chartist.Line('.ct-chart', {
   *   labels: [1, 2, 3, 4, 5],
   *   series: [[1, 2, 8, 1, 7]]
   * }, {
   *   lineSmooth: Chartist.Interpolation.step({
   *     postpone: true,
   *     fillHoles: false
   *   })
   * });
 *
 * @memberof Chartist.Interpolation
 * @param options
 * @returns {Function}
 */
export function step(options) {
  var defaultOptions = {
    postpone: true,
    fillHoles: false
  };

  options = extend({}, defaultOptions, options);

  return function step(pathCoordinates, valueData) {
    var path = new SvgPath();

    var prevX, prevY, prevData;

    for (var i = 0; i < pathCoordinates.length; i += 2) {
      var currX = pathCoordinates[i];
      var currY = pathCoordinates[i + 1];
      var currData = valueData[i / 2];

      // If the current point is also not a hole we can draw the step lines
      if(currData.value !== undefined) {
        if(prevData === undefined) {
          path.move(currX, currY, false, currData);
        } else {
          if(options.postpone) {
            // If postponed we should draw the step line with the value of the previous value
            path.line(currX, prevY, false, prevData);
          } else {
            // If not postponed we should draw the step line with the value of the current value
            path.line(prevX, currY, false, currData);
          }
          // Line to the actual point (this should only be a Y-Axis movement
          path.line(currX, currY, false, currData);
        }

        prevX = currX;
        prevY = currY;
        prevData = currData;
      } else if(!options.fillHoles) {
        prevX = prevY = prevData = undefined;
      }
    }

    return path;
  };
}
