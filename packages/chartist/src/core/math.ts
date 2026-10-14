import type { Bounds } from './types';
import { precision as globalPrecision } from './constants';

/** A tiny number, about the gap between 1 and the next float: the tolerance of float comparisons. */
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
 * Rounds a value to a number of digits after the decimal point, to remove
 * float errors such as `0.30000000000000004`. `0` digits round to whole
 * numbers.
 * @param value The value to round
 * @param [digits] The digits after the decimal point; without it, the
 *   global precision (8)
 * @returns The rounded value
 */
export function roundWithPrecision(value: number, digits?: number) {
  const precision = Math.pow(10, digits ?? globalPrecision);
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
