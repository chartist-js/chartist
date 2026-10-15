import type { SegmentData } from '../core';
import { getMultiValue } from '../core';
import { SvgPath } from '../svg';

/** The options of {@link Interpolation.step}. */
export interface StepInterpolationOptions {
  /**
   * Holds each value until the next point, so the step happens where the
   * value changes (the default). With `false`, the line steps to the next
   * value right away.
   */
  postpone?: boolean;
  /**
   * Joins the line across holes (`null` or `undefined` values) instead of
   * breaking it. Off by default.
   */
  fillHoles?: boolean;
}

/**
 * Draws a line in steps: horizontal and vertical segments instead of
 * diagonals or curves. Each step adds a corner to the path, and with
 * `showPoint` a point is drawn there too.
 *
 * @example
 * ```ts
 * import { lineChart, Interpolation } from 'chartist';
 *
 * lineChart(
 *   '#chart',
 *   { labels: [1, 2, 3, 4, 5], series: [[1, 2, 8, 1, 7]] },
 *   { lineSmooth: Interpolation.step({ postpone: false }) }
 * );
 * ```
 *
 * @param options When to step, and whether to join the line across holes.
 * @returns The interpolation, for the `lineSmooth` option.
 */
export function step(options?: StepInterpolationOptions) {
  const finalOptions = {
    postpone: true,
    fillHoles: false,
    ...options
  };

  return function stepInterpolation(
    pathCoordinates: number[],
    valueData: SegmentData[]
  ) {
    const path = new SvgPath();

    let prevX = 0;
    let prevY = 0;
    let prevData;

    for (let i = 0; i < pathCoordinates.length; i += 2) {
      const currX = pathCoordinates[i];
      const currY = pathCoordinates[i + 1];
      const currData = valueData[i / 2];

      // If the current point is also not a hole we can draw the step lines
      if (getMultiValue(currData.value) !== undefined) {
        if (prevData === undefined) {
          path.move(currX, currY, false, currData);
        } else {
          if (finalOptions.postpone) {
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
      } else if (!finalOptions.fillHoles) {
        prevX = prevY = 0;
        prevData = undefined;
      }
    }

    return path;
  };
}
