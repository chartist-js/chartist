import type { Bounds } from './types';
import { precision as globalPrecision } from './constants';

export const EPSILON = 2.221e-16;

/**
 * Calculate the order of magnitude for the chart scale
 * @param value The value Range of the chart
 * @return The order of magnitude
 */
export function orderOfMagnitude(value: number) {
  return Math.floor(Math.log(Math.abs(value)) / Math.LN10);
}

/**
 * Project a data length into screen coordinates (pixels)
 * @param axisLength The svg element for the chart
 * @param length Single data value from a series array
 * @param bounds All the values to set the bounds of the chart
 * @return The projected data length in pixels
 */
export function projectLength(
  axisLength: number,
  length: number,
  bounds: Bounds
) {
  return (length / bounds.range) * axisLength;
}

/**
 * This helper function can be used to round values with certain precision level after decimal. This is used to prevent rounding errors near float point precision limit.
 * @param value The value that should be rounded with precision
 * @param [digits] The number of digits after decimal used to do the rounding
 * @returns Rounded value
 */
export function roundWithPrecision(value: number, digits?: number) {
  const precision = Math.pow(10, digits || globalPrecision);
  return Math.round(value * precision) / precision;
}

/**
 * Pollard Rho Algorithm to find smallest factor of an integer value. There are more efficient algorithms for factorization, but this one is quite efficient and not so complex.
 * @param num An integer number where the smallest factor should be searched for
 * @returns The smallest integer factor of the parameter num.
 */
export function rho(num: number) {
  if (num === 1) {
    return num;
  }

  function gcd(p: number, q: number): number {
    if (p % q === 0) {
      return q;
    } else {
      return gcd(q, p % q);
    }
  }

  function f(x: number) {
    return x * x + 1;
  }

  let x1 = 2;
  let x2 = 2;
  let divisor: number;

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
 * @param centerX X-axis coordinates of center point of circle segment
 * @param centerY X-axis coordinates of center point of circle segment
 * @param radius Radius of circle segment
 * @param angleInDegrees Angle of circle segment in degrees
 * @return Coordinates of point on circumference
 */
export function polarToCartesian(
  centerX: number,
  centerY: number,
  radius: number,
  angleInDegrees: number
) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;

  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians)
  };
}
