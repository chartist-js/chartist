/**
 * Chartist path interpolation functions.
 *
 * @module Chartist.Interpolation
 */
/* global Chartist */
(function(window, document, Chartist) {
  'use strict';

  Chartist.Interpolation = {};

  /**
   * This interpolation function does not smooth the path and the result is only containing lines and no curves.
   *
   * @memberof Chartist.Interpolation
   * @return {Function}
   */
  Chartist.Interpolation.none = function() {
    return function none(pathCoordinates, valueData) {
      var path = new Chartist.Svg.Path().move(pathCoordinates[0], pathCoordinates[1], false, valueData[0]);

      for(var i = 3; i < pathCoordinates.length; i += 2) {
        path.line(pathCoordinates[i - 1], pathCoordinates[i], false, valueData[(i - 1) / 2]);
      }

      return path;
    };
  };

  /**
   * Simple smoothing creates horizontal handles that are positioned with a fraction of the length between two data points. You can use the divisor option to specify the amount of smoothing.
   *
   * Simple smoothing can be used instead of `Chartist.Smoothing.cardinal` if you'd like to get rid of the artifacts it produces sometimes. Simple smoothing produces less flowing lines but is accurate by hitting the points and it also doesn't swing below or above the given data point.
   *
   * All smoothing functions within Chartist are factory functions that accept an options parameter. The simple interpolation function accepts one configuration parameter `divisor`, between 1 and ∞, which controls the smoothing characteristics.
   *
   * @example
   * var chart = new Chartist.Line('.ct-chart', {
   *   labels: [1, 2, 3, 4, 5],
   *   series: [[1, 2, 8, 1, 7]]
   * }, {
   *   lineSmooth: Chartist.Interpolation.simple({
   *     divisor: 2
   *   })
   * });
   *
   *
   * @memberof Chartist.Interpolation
   * @param {Object} options The options of the simple interpolation factory function.
   * @return {Function}
   */
  Chartist.Interpolation.simple = function(options) {
    var defaultOptions = {
      divisor: 2
    };
    options = Chartist.extend({}, defaultOptions, options);

    var d = 1 / Math.max(1, options.divisor);

    return function simple(pathCoordinates, valueData) {
      var path = new Chartist.Svg.Path().move(pathCoordinates[0], pathCoordinates[1], false, valueData[0]);

      for(var i = 2; i < pathCoordinates.length; i += 2) {
        var prevX = pathCoordinates[i - 2],
            prevY = pathCoordinates[i - 1],
            currX = pathCoordinates[i],
            currY = pathCoordinates[i + 1],
            length = (currX - prevX) * d;

        path.curve(
          prevX + length,
          prevY,
          currX - length,
          currY,
          currX,
          currY,
          false,
          valueData[i / 2]
        );
      }

      return path;
    };
  };

  /**
   * Cardinal / Catmull-Rome spline interpolation is the default smoothing function in Chartist. It produces nice results where the splines will always meet the points. It produces some artifacts though when data values are increased or decreased rapidly. The line may not follow a very accurate path and if the line should be accurate this smoothing function does not produce the best results.
   *
   * Cardinal splines can only be created if there are more than two data points. If this is not the case this smoothing will fallback to `Chartist.Smoothing.none`.
   *
   * All smoothing functions within Chartist are factory functions that accept an options parameter. The cardinal interpolation function accepts one configuration parameter `tension`, between 0 and 1, which controls the smoothing intensity.
   *
   * @example
   * var chart = new Chartist.Line('.ct-chart', {
   *   labels: [1, 2, 3, 4, 5],
   *   series: [[1, 2, 8, 1, 7]]
   * }, {
   *   lineSmooth: Chartist.Interpolation.cardinal({
   *     tension: 1
   *   })
   * });
   *
   * @memberof Chartist.Interpolation
   * @param {Object} options The options of the cardinal factory function.
   * @return {Function}
   */
  Chartist.Interpolation.cardinal = function(options) {
    var defaultOptions = {
      tension: 1
    };

    options = Chartist.extend({}, defaultOptions, options);

    var t = Math.min(1, Math.max(0, options.tension)),
      c = 1 - t;

    return function cardinal(pathCoordinates, valueData) {
      // If less than two points we need to fallback to no smoothing
      if(pathCoordinates.length <= 4) {
        return Chartist.Interpolation.none()(pathCoordinates, valueData);
      }

      var path = new Chartist.Svg.Path().move(pathCoordinates[0], pathCoordinates[1], false, valueData[0]),
        z;

      for (var i = 0, iLen = pathCoordinates.length; iLen - 2 * !z > i; i += 2) {
        var p = [
          {x: +pathCoordinates[i - 2], y: +pathCoordinates[i - 1]},
          {x: +pathCoordinates[i], y: +pathCoordinates[i + 1]},
          {x: +pathCoordinates[i + 2], y: +pathCoordinates[i + 3]},
          {x: +pathCoordinates[i + 4], y: +pathCoordinates[i + 5]}
        ];
        if (z) {
          if (!i) {
            p[0] = {x: +pathCoordinates[iLen - 2], y: +pathCoordinates[iLen - 1]};
          } else if (iLen - 4 === i) {
            p[3] = {x: +pathCoordinates[0], y: +pathCoordinates[1]};
          } else if (iLen - 2 === i) {
            p[2] = {x: +pathCoordinates[0], y: +pathCoordinates[1]};
            p[3] = {x: +pathCoordinates[2], y: +pathCoordinates[3]};
          }
        } else {
          if (iLen - 4 === i) {
            p[3] = p[2];
          } else if (!i) {
            p[0] = {x: +pathCoordinates[i], y: +pathCoordinates[i + 1]};
          }
        }

        path.curve(
          (t * (-p[0].x + 6 * p[1].x + p[2].x) / 6) + (c * p[2].x),
          (t * (-p[0].y + 6 * p[1].y + p[2].y) / 6) + (c * p[2].y),
          (t * (p[1].x + 6 * p[2].x - p[3].x) / 6) + (c * p[2].x),
          (t * (p[1].y + 6 * p[2].y - p[3].y) / 6) + (c * p[2].y),
          p[2].x,
          p[2].y,
          false,
          valueData[(i + 2) / 2]
        );
      }

      return path;
    };
  };

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
   *     postpone: true
   *   })
   * });
   *
   * @memberof Chartist.Interpolation
   * @param options
   * @returns {Function}
   */
  Chartist.Interpolation.step = function(options) {
    var defaultOptions = {
      postpone: true
    };

    options = Chartist.extend({}, defaultOptions, options);

    return function step(pathCoordinates, valueData) {
      var path = new Chartist.Svg.Path().move(pathCoordinates[0], pathCoordinates[1], false, valueData[0]);

      for (var i = 2; i < pathCoordinates.length; i += 2) {
        var prevX = pathCoordinates[i - 2],
          prevY = pathCoordinates[i - 1],
          currX = pathCoordinates[i],
          currY = pathCoordinates[i + 1];

        if(options.postpone) {
          path.line(currX, prevY, false, valueData[(i - 2) / 2]);
        } else {
          path.line(prevX, currY, false, valueData[i / 2]);
        }


        path.line(currX, currY, false, valueData[i / 2]);
      }

      return path;
    };
  };

}(window, document, Chartist));
