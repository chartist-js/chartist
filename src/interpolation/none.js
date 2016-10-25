import {extend, getMultiValue} from '../core/core';
import {SvgPath} from '../svg/svg-path';

/**
 * This interpolation function does not smooth the path and the result is only containing lines and no curves.
 *
 * @example
 * var chart = new Chartist.Line('.ct-chart', {
 *   labels: [1, 2, 3, 4, 5],
 *   series: [[1, 2, 8, 1, 7]]
 * }, {
 *   lineSmooth: Chartist.Interpolation.none({
 *     fillHoles: false
 *   })
 * });
 *
 *
 * @memberof Chartist.Interpolation
 * @return {Function}
 */
export function none(options) {
  const defaultOptions = {
    fillHoles: false
  };

  options = extend({}, defaultOptions, options);

  return function none(pathCoordinates, valueData) {
    const path = new SvgPath();
    let hole = true;

    for(let i = 0; i < pathCoordinates.length; i += 2) {
      const currX = pathCoordinates[i];
      const currY = pathCoordinates[i + 1];
      const currData = valueData[i / 2];

      if(getMultiValue(currData.value) !== undefined) {

        if(hole) {
          path.move(currX, currY, false, currData);
        } else {
          path.line(currX, currY, false, currData);
        }

        hole = false;
      } else if(!options.fillHoles) {
        hole = true;
      }
    }

    return path;
  };
}
