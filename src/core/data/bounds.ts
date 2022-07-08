import type { Bounds } from '../types';
import {
  orderOfMagnitude,
  projectLength,
  roundWithPrecision,
  rho,
  EPSILON
} from '../math';

/**
 * Calculate and retrieve all the bounds for the chart and return them in one array
 * @param axisLength The length of the Axis used for
 * @param highLow An object containing a high and low property indicating the value range of the chart.
 * @param scaleMinSpace The minimum projected length a step should result in
 * @param onlyInteger
 * @return All the values to set the bounds of the chart
 */
export function getBounds(
  axisLength: number,
  highLow: { high: number; low: number },
  scaleMinSpace: number,
  onlyInteger = false
) {
  const bounds: Bounds = {
    high: highLow.high,
    low: highLow.low,
    valueRange: 0,
    oom: 0,
    step: 0,
    min: 0,
    max: 0,
    range: 0,
    numberOfSteps: 0,
    values: []
  };

  bounds.valueRange = bounds.high - bounds.low;
  bounds.oom = orderOfMagnitude(bounds.valueRange);
  bounds.step = Math.pow(10, bounds.oom);
  bounds.min = Math.floor(bounds.low / bounds.step) * bounds.step;
  bounds.max = Math.ceil(bounds.high / bounds.step) * bounds.step;
  bounds.range = bounds.max - bounds.min;
  bounds.numberOfSteps = Math.round(bounds.range / bounds.step);

  // Optimize scale step by checking if subdivision is possible based on horizontalGridMinSpace
  // If we are already below the scaleMinSpace value we will scale up
  const length = projectLength(axisLength, bounds.step, bounds);
  const scaleUp = length < scaleMinSpace;
  const smallestFactor = onlyInteger ? rho(bounds.range) : 0;

  // First check if we should only use integer steps and if step 1 is still larger than scaleMinSpace so we can use 1
  if (onlyInteger && projectLength(axisLength, 1, bounds) >= scaleMinSpace) {
    bounds.step = 1;
  } else if (
    onlyInteger &&
    smallestFactor < bounds.step &&
    projectLength(axisLength, smallestFactor, bounds) >= scaleMinSpace
  ) {
    // If step 1 was too small, we can try the smallest factor of range
    // If the smallest factor is smaller than the current bounds.step and the projected length of smallest factor
    // is larger than the scaleMinSpace we should go for it.
    bounds.step = smallestFactor;
  } else {
    // Trying to divide or multiply by 2 and find the best step value
    let optimizationCounter = 0;
    for (;;) {
      if (
        scaleUp &&
        projectLength(axisLength, bounds.step, bounds) <= scaleMinSpace
      ) {
        bounds.step *= 2;
      } else if (
        !scaleUp &&
        projectLength(axisLength, bounds.step / 2, bounds) >= scaleMinSpace
      ) {
        bounds.step /= 2;
        if (onlyInteger && bounds.step % 1 !== 0) {
          bounds.step *= 2;
          break;
        }
      } else {
        break;
      }

      if (optimizationCounter++ > 1000) {
        throw new Error(
          'Exceeded maximum number of iterations while optimizing scale step!'
        );
      }
    }
  }

  bounds.step = Math.max(bounds.step, EPSILON);
  function safeIncrement(value: number, increment: number) {
    // If increment is too small use *= (1+EPSILON) as a simple nextafter
    if (value === (value += increment)) {
      value *= 1 + (increment > 0 ? EPSILON : -EPSILON);
    }
    return value;
  }

  // Narrow min and max based on new step
  let newMin = bounds.min;
  let newMax = bounds.max;
  while (newMin + bounds.step <= bounds.low) {
    newMin = safeIncrement(newMin, bounds.step);
  }
  while (newMax - bounds.step >= bounds.high) {
    newMax = safeIncrement(newMax, -bounds.step);
  }
  bounds.min = newMin;
  bounds.max = newMax;
  bounds.range = bounds.max - bounds.min;

  const values: number[] = [];
  for (let i = bounds.min; i <= bounds.max; i = safeIncrement(i, bounds.step)) {
    const value = roundWithPrecision(i);
    if (value !== values[values.length - 1]) {
      values.push(value);
    }
  }
  bounds.values = values;

  return bounds;
}
