import {precision} from './globals';

/**
 * Calculate the order of magnitude for the chart scale
 *
 * @memberof Chartist.Core
 * @param {Number} value The value Range of the chart
 * @return {Number} The order of magnitude
 */
export function orderOfMagnitude(value) {
  return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
}

/**
 * Project a data length into screen coordinates (pixels)
 *
 * @memberof Chartist.Core
 * @param {Object} axisLength The svg element for the chart
 * @param {Number} length Single data value from a series array
 * @param {Object} bounds All the values to set the bounds of the chart
 * @return {Number} The projected data length in pixels
 */
export function projectLength(axisLength, length, bounds) {
  return length / bounds.range * axisLength;
}

/**
 * This helper function can be used to round values with certain precision level after decimal. This is used to prevent rounding errors near float point precision limit.
 *
 * @memberof Chartist.Core
 * @param {Number} value The value that should be rounded with precision
 * @param {Number} [digits] The number of digits after decimal used to do the rounding
 * @returns {number} Rounded value
 */
export function roundWithPrecision(value, digits) {
  var precision = Math.pow(10, digits || precision);
  return Math.round(value * precision) / precision;
}

/**
 * Pollard Rho Algorithm to find smallest factor of an integer value. There are more efficient algorithms for factorization, but this one is quite efficient and not so complex.
 *
 * @memberof Chartist.Core
 * @param {Number} num An integer number where the smallest factor should be searched for
 * @returns {Number} The smallest integer factor of the parameter num.
 */
export function rho(num) {
  if(num === 1) {
    return num;
  }

  function gcd(p, q) {
    if (p % q === 0) {
      return q;
    } else {
      return gcd(q, p % q);
    }
  }

  function f(x) {
    return x * x + 1;
  }

  var x1 = 2, x2 = 2, divisor;
  if (num % 2 === 0) {
    return 2;
  }

  do {
    x1 = f(x1) % num;
    x2 = f(f(x2)) % num;
    divisor = gcd(Math.abs(x1 - x2), num);
  } while (divisor === 1);

  return divisor;
}

/**
 * Calculate cartesian coordinates of polar coordinates
 *
 * @memberof Chartist.Core
 * @param {Number} centerX X-axis coordinates of center point of circle segment
 * @param {Number} centerY X-axis coordinates of center point of circle segment
 * @param {Number} radius Radius of circle segment
 * @param {Number} angleInDegrees Angle of circle segment in degrees
 * @return {{x:Number, y:Number}} Coordinates of point on circumference
 */
export function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
  var angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;

  return {
    x: centerX + (radius * Math.cos(angleInRadians)),
    y: centerY + (radius * Math.sin(angleInRadians))
  };
}
