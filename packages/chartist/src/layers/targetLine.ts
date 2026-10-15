/**
 * Target line layer: lines across the chart area at constant values on
 * one axis, such as a goal, a limit or an average, each with an optional
 * label.
 */
import { textAscent } from '../render/measure';
import type { Layer } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';

/** One line of a {@link targetLine} layer. */
export interface TargetLineSpec {
  /**
   * The value the line is drawn at, on the layer's axis. On a step axis,
   * the position by index, as for the axis's ticks.
   */
  readonly value: number;
  /** The text drawn next to the line; no label without it. */
  readonly label?: string;
  /** Extra classes for the line and its label, e.g. `ct-series-b`. */
  readonly className?: string;
}

/** The options of a {@link targetLine} layer that all its lines share. */
export interface TargetLineSharedOptions {
  /**
   * The id of the axis the values are on: a Y axis draws horizontal
   * lines, an X axis vertical ones. Default: the first Y axis.
   */
  readonly axis?: string;
  /**
   * Where the labels sit along their lines: at the `end` (right, or top
   * for a vertical line) or the `start` (left, or bottom).
   */
  readonly labelPosition?: 'start' | 'end';
  /**
   * Replaces the classes of what the layer draws: `group`
   * (`ct-target-lines`), `line` (`ct-target-line`) and `label`
   * (`ct-target-label`).
   */
  readonly classNames?: {
    readonly group?: string;
    readonly line?: string;
    readonly label?: string;
  };
}

/** The options of a {@link targetLine} layer that draws one line. */
export interface TargetLineValueOptions
  extends TargetLineSharedOptions, TargetLineSpec {
  /** Not with `value`: use one form or the other. */
  readonly lines?: undefined;
}

/** The options of a {@link targetLine} layer that draws several lines. */
export interface TargetLineListOptions extends TargetLineSharedOptions {
  /** The lines, drawn in this order. */
  readonly lines: readonly TargetLineSpec[];
  /** Not with `lines`: give each line its value there. */
  readonly value?: undefined;
  /** Not with `lines`: give each line its label there. */
  readonly label?: undefined;
  /** Not with `lines`: give each line its class there. */
  readonly className?: undefined;
}

/**
 * The options of the {@link targetLine} layer: one line's `value`,
 * `label` and `className`, or several `lines`, plus the options they
 * share.
 * @experimental
 */
export type TargetLineOptions = TargetLineValueOptions | TargetLineListOptions;

const CLASS_NAMES = {
  group: 'ct-target-lines',
  line: 'ct-target-line',
  label: 'ct-target-label'
};

/** The distance in px between a label and its line or the area's edge. */
const LABEL_INSET = 4;

function specsOf(options: TargetLineOptions): readonly TargetLineSpec[] {
  const { lines, value, label, className } = options;
  if (lines !== undefined) {
    if (value !== undefined || label !== undefined || className !== undefined) {
      throw new Error(
        'Layer "targetLine": give either one line (value, label, className) or lines, not both'
      );
    }
    return lines;
  }
  if (value === undefined) {
    throw new Error('Layer "targetLine" needs a value or lines');
  }
  return [{ value, label, className }];
}

/**
 * Creates a layer that draws lines across the chart area at constant
 * values on one axis, such as a goal or a limit (`g.ct-target-lines` with
 * a `line.ct-target-line` per line). A line on a Y axis is horizontal, on
 * an X axis vertical. A line can have a label, drawn as SVG text next to
 * it inside the chart area, and a class, e.g. `ct-series-b` for a
 * series' color. The axis widens to include the values, unless its own
 * `low` or `high` leave them out; a line outside the axis isn't drawn.
 *
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   cartesianAxes,
 *   chart,
 *   line,
 *   stepAxis,
 *   targetLine
 * } from 'chartist';
 *
 * const months = ['Jan', 'Feb', 'Mar', 'Apr'];
 *
 * chart('#chart', {
 *   data: { labels: months, series: [[620, 810, 740, 930]] },
 *   axes: cartesianAxes([
 *     { id: 'month', side: 'bottom', type: stepAxis(), ticks: months },
 *     { id: 'sales', side: 'left', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [
 *     axisGrid(),
 *     line(),
 *     targetLine({
 *       lines: [
 *         { value: 700, label: 'Min' },
 *         { value: 1000, label: 'Goal', className: 'ct-series-b' }
 *       ]
 *     }),
 *     axisLabels()
 *   ]
 * });
 * ```
 * @experimental
 */
export function targetLine(options: TargetLineOptions): Layer {
  const specs = specsOf(options);
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  const atStart = options.labelPosition === 'start';
  const values = specs.map(spec => spec.value);
  return {
    type: 'targetLine',
    coordinates: ['cartesian'],
    // The layer draws no series, so the data shapes no axis range for it.
    series: [],
    extent({ axes }) {
      const id = options.axis ?? axes.y;
      return id === undefined || values.length === 0
        ? {}
        : { [id]: { low: Math.min(...values), high: Math.max(...values) } };
    },
    compose({ area, axes, measureText }) {
      const all = axes.all ?? [];
      const axis =
        options.axis === undefined
          ? all.find(candidate => candidate.dimension === 'y')
          : all.find(candidate => candidate.id === options.axis);
      if (!axis) {
        throw new Error(
          options.axis === undefined
            ? 'Layer "targetLine" needs a y axis'
            : `Chartist: unknown axis "${options.axis}" in layer "targetLine"`
        );
      }
      const horizontal = axis.dimension === 'y';

      const children = specs.flatMap((spec, index): SceneNode[] => {
        const { value, label, className } = spec;
        const relative = axis.project(value, value);
        // Values outside the axis (its own low and high win) draw nothing.
        if (
          !Number.isFinite(relative) ||
          relative < -1e-9 ||
          relative > axis.length + 1e-9
        ) {
          return [];
        }
        const ends = horizontal
          ? {
              x1: area.x1,
              y1: area.y1 - relative,
              x2: area.x2,
              y2: area.y1 - relative
            }
          : {
              x1: area.x1 + relative,
              y1: area.y2,
              x2: area.x1 + relative,
              y2: area.y1
            };
        const extra = className ? ` ${className}` : '';
        const lineNode = node('line', ends, `${classNames.line}${extra}`, {
          role: 'targetLine',
          ctx: {
            axis,
            value,
            index,
            ...(label !== undefined && { label }),
            ...ends
          }
        });
        if (label === undefined || label === '') {
          return [lineNode];
        }

        const labelClasses = `${classNames.label}${extra}`;
        let position: { x: number; y: number; anchor: 'start' | 'end' };
        if (horizontal) {
          // Just above the line, inset from the area's edge.
          position = {
            x: atStart ? area.x1 + LABEL_INSET : area.x2 - LABEL_INSET,
            y: ends.y1 - LABEL_INSET,
            anchor: atStart ? 'start' : 'end'
          };
        } else {
          // Just right of the line, at its top (end) or bottom (start).
          const fontSize =
            measureText(label, { classes: labelClasses.split(' ') }).fontSize ??
            12;
          position = {
            x: ends.x1 + LABEL_INSET,
            y: atStart
              ? area.y1 - LABEL_INSET
              : area.y2 + LABEL_INSET + textAscent * fontSize,
            anchor: 'start'
          };
        }
        const labelNode = node(
          'text',
          { x: position.x, y: position.y, 'text-anchor': position.anchor },
          labelClasses,
          {
            role: 'targetLabel',
            ctx: {
              axis,
              value,
              index,
              text: label,
              x: position.x,
              y: position.y
            }
          }
        ).text(label);
        return [lineNode, labelNode];
      });

      return [withFields(node('g', {}, classNames.group), { children })];
    }
  };
}
