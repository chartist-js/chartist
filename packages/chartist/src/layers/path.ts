/**
 * Paths through a series' values, shared by the line and band layers:
 * projection into the chart area, interpolation, and reversal for closing
 * a band's lower edge.
 */
import type { LineInterpolation } from '../charts/LineChart/LineChart.types';
import type { NormalizedSeries, SegmentData } from '../core/types';
import { monotoneCubic } from '../interpolation/monotoneCubic';
import { none } from '../interpolation/none';
import type { Area } from '../pipeline/types';
import type { ScaleAxis } from '../scales/axis';
import { SvgPath } from '../svg/SvgPath';
import type { CurveParams, PathCommand } from '../svg/types';

/** The interpolation for a `lineSmooth` option: smooth, straight or given. */
export function interpolationOf(
  lineSmooth: boolean | LineInterpolation
): LineInterpolation {
  return typeof lineSmooth === 'function'
    ? lineSmooth
    : lineSmooth
      ? monotoneCubic()
      : none();
}

/**
 * The px shift that puts points in the middle of each step of a step axis,
 * where bars are centered, for `align: 'center'`.
 */
export function centerShift(
  axisX: ScaleAxis,
  align: 'start' | 'center' | undefined
): number {
  return align === 'center' && axisX.kind === 'step' && !axisX.stretch
    ? (axisX.step ?? 0) / 2
    : 0;
}

/**
 * Projects a series' values into the chart area and interpolates a path
 * through them. Holes break the path unless the interpolation fills them.
 * @param meta The meta of a value, attached to its path element.
 */
export function seriesPath(
  values: NormalizedSeries,
  axes: { readonly x: ScaleAxis; readonly y: ScaleAxis },
  area: Area,
  shift: number,
  interpolation: LineInterpolation,
  meta: (valueIndex: number) => unknown = () => undefined
): SvgPath {
  const pathCoordinates: number[] = [];
  const pathData: SegmentData[] = [];
  values.forEach((value, valueIndex) => {
    pathCoordinates.push(
      area.x1 + shift + axes.x.project(value, valueIndex, values),
      area.y1 - axes.y.project(value, valueIndex, values)
    );
    pathData.push({ value, valueIndex, meta: meta(valueIndex) });
  });
  return interpolation(pathCoordinates, pathData);
}

/**
 * The same path traced backward: it starts where the path ends, and each
 * segment runs to the previous point, with a curve's control points
 * swapped, so it draws the same shape. Holes (`M` commands within the
 * path) are kept between the same points. Arcs aren't supported.
 */
export function reversePath(path: SvgPath): SvgPath {
  const reversed = new SvgPath();
  const elements = path.pathElements;
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    const target = elements[i - 1];
    if (i === elements.length - 1 || elements[i + 1].command === 'M') {
      reversed.move(element.x, element.y, false, element.data);
    }
    if (element.command === 'M' || !target) {
      continue;
    }
    if (element.command === 'C') {
      const curve = element as PathCommand<CurveParams>;
      reversed.curve(
        curve.x2,
        curve.y2,
        curve.x1,
        curve.y1,
        target.x,
        target.y,
        false,
        target.data
      );
    } else if (element.command === 'L') {
      reversed.line(target.x, target.y, false, target.data);
    } else {
      throw new Error(
        `Chartist: can't reverse a path with "${element.command}" commands`
      );
    }
  }
  return reversed;
}
