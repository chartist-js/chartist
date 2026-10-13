/**
 * Grid lines, grid background and HTML labels of an axis as scene nodes,
 * with the geometry and classes of 1.x `Axis.createGridAndLabels`.
 */
import { namespaces } from '../core/constants';
import type { AxisOptions, ChartPadding } from '../core/types';
import type { Area } from '../pipeline/types';
import { node, type SceneNode } from '../scene/node';
import { isFalseyButZero } from '../utils/utils';
import type { ScaleAxis } from './axis';

export interface AxisClassNames {
  readonly grid: string;
  readonly label: string;
  readonly horizontal: string;
  readonly vertical: string;
  readonly start: string;
  readonly end: string;
}

/** Axis options with the 1.x defaults applied. */
export interface DrawnAxisOptions extends AxisOptions {
  readonly offset: number;
  readonly position: 'start' | 'end';
  readonly labelOffset: { x: number; y: number };
  readonly showLabel: boolean;
  readonly showGrid: boolean;
  readonly labelInterpolationFnc: NonNullable<
    AxisOptions['labelInterpolationFnc']
  >;
}

export interface AxisFrame {
  readonly area: Area;
  readonly padding: ChartPadding;
  /** The 1.x options of both axes (presets). */
  readonly axisX?: DrawnAxisOptions;
  readonly axisY?: DrawnAxisOptions;
  readonly classNames: AxisClassNames;
  /**
   * Composed charts: this axis's options and place. Labels go to `side`,
   * `inset` px further out than the area edge (stacked axes).
   */
  readonly options?: DrawnAxisOptions;
  /**
   * Composed charts: positions a label on any side. Kept out of this module
   * (see `layers/axes.ts`), so the presets don't bundle it.
   */
  readonly place?: LabelPlacer;
  /** Whether labels get the start class (top, left) or the end class. */
  readonly atStart?: boolean;
}

/** Position of a tick and the offset of its label, per axis side. */
export type LabelPlacer = (
  axis: ScaleAxis,
  relative: number,
  labelLength: number,
  options: DrawnAxisOptions,
  area: Area
) => { position: number; labelOffset: { x: number; y: number } };

const UNITS = {
  x: {
    pos: 'x',
    len: 'width',
    counterPos: 'y',
    counterLen: 'height',
    dir: 'horizontal'
  },
  y: {
    pos: 'y',
    len: 'height',
    counterPos: 'x',
    counterLen: 'width',
    dir: 'vertical'
  }
} as const;

/** Grid line and label nodes of one axis, in tick order. */
export function axisNodes(
  axis: ScaleAxis,
  frame: AxisFrame
): { grids: SceneNode[]; labels: SceneNode[] } {
  const { area, padding, classNames } = frame;
  const units = UNITS[axis.dimension];
  const options = (frame.options ??
    (axis.dimension === 'x' ? frame.axisX : frame.axisY))!;
  const place = frame.place;
  const projected = axis.ticks.map((tick, i) => axis.project(tick, i));
  const labelValues = axis.ticks.map(options.labelInterpolationFnc);
  const gridOffset = axis.dimension === 'x' ? area.y2 : area.x1;
  const gridLength = axis.dimension === 'x' ? area.height : area.width;
  const grids: SceneNode[] = [];
  const labels: SceneNode[] = [];

  projected.forEach((relative, index) => {
    const labelValue = labelValues[index];
    // 1.x: the distance to the next tick, or the rest of the axis.
    const labelLength = projected[index + 1]
      ? projected[index + 1] - relative
      : Math.max(axis.length - relative, axis.length / axis.ticks.length);

    if (labelValue !== '' && isFalseyButZero(labelValue)) {
      return;
    }

    let position: number;
    let labelOffset = { x: 0, y: 0 };
    if (place) {
      ({ position, labelOffset } = place(
        axis,
        relative,
        labelLength,
        options,
        area
      ));
    } else if (axis.dimension === 'x') {
      const axisX = frame.axisX!;
      position = area.x1 + relative;
      labelOffset.x = axisX.labelOffset.x;
      labelOffset.y =
        axisX.position === 'start'
          ? padding.top + axisX.labelOffset.y + 5
          : area.y1 + axisX.labelOffset.y + 5;
    } else {
      const axisY = frame.axisY!;
      position = area.y1 - relative;
      labelOffset.y = axisY.labelOffset.y - labelLength;
      labelOffset.x =
        axisY.position === 'start'
          ? padding.left + axisY.labelOffset.x
          : area.x2 + axisY.labelOffset.x + 10;
    }

    if (options.showGrid) {
      const attrs = {
        [`${units.pos}1`]: position,
        [`${units.pos}2`]: position,
        [`${units.counterPos}1`]: gridOffset,
        [`${units.counterPos}2`]: gridOffset + gridLength
      };
      grids.push(
        node('line', attrs, `${classNames.grid} ${classNames[units.dir]}`, {
          role: 'grid',
          ctx: { axis, index, ...attrs }
        })
      );
    }

    if (options.showLabel) {
      const attrs = {
        [units.pos]: position + labelOffset[units.pos],
        [units.counterPos]: labelOffset[units.counterPos],
        [units.len]: labelLength,
        [units.counterLen]: Math.max(0, options.offset - 10)
      };
      const classes = [
        classNames.label,
        classNames[units.dir],
        (frame.atStart ?? options.position === 'start')
          ? classNames.start
          : classNames.end
      ].join(' ');
      // 1.x sizes the span in px, the axis direction first.
      const style =
        `${units.len}: ${Math.round(attrs[units.len])}px; ` +
        `${units.counterLen}: ${Math.round(attrs[units.counterLen])}px;`;
      const span = node(
        'span',
        // 1.x writes the xmlns namespace URI here; kept for identical DOM.
        { style, xmlns: namespaces.xmlns },
        classes
      ).text(String(labelValue));
      labels.push(
        node('foreignObject', { style: 'overflow: visible;', ...attrs }, '', {
          role: 'label',
          ctx: { axis, index, text: labelValue, ...attrs }
        }).append(span)
      );
    }
  });

  return { grids, labels };
}

/** The 1.x grid background: a rect over the chart area. */
export function gridBackground(area: Area, className: string): SceneNode {
  return node(
    'rect',
    { x: area.x1, y: area.y2, width: area.width, height: area.height },
    className,
    { role: 'gridBackground' }
  );
}
