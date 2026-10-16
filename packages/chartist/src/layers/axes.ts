/**
 * Grid and label layers for composed charts: `axisGrid()` and
 * `axisLabels()` draw the axes of `cartesianAxes()` with the 1.x geometry
 * and classes, so 1.x CSS applies.
 */
import type { Layer, LayerContext } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import type { LabelMode } from '../render/measure';
import type { PlacedScaleAxis } from '../scales/axis';
import { labelTransformOf } from './label';
import {
  axisNodes,
  gridBackground,
  type AxisClassNames,
  type DrawnAxisOptions,
  type LabelPlacer
} from '../scales/grid';
import {
  svgLabels,
  type LabelAlign,
  type SvgLabelBuilder
} from '../scales/svgLabels';

/**
 * The classes {@link axisGrid} and {@link axisLabels} give what they draw.
 * The defaults are the 1.x classes, so 1.x CSS applies.
 */
export interface AxisLayerClassNames extends AxisClassNames {
  /** The group of all grid lines (`ct-grids`). */
  readonly gridGroup: string;
  /** The group of all labels (`ct-labels`). */
  readonly labelGroup: string;
  /** The rect behind the grid, with `background: true` (`ct-grid-background`). */
  readonly gridBackground: string;
}

const CLASS_NAMES: AxisLayerClassNames = {
  grid: 'ct-grid',
  label: 'ct-label',
  horizontal: 'ct-horizontal',
  vertical: 'ct-vertical',
  start: 'ct-start',
  end: 'ct-end',
  gridGroup: 'ct-grids',
  labelGroup: 'ct-labels',
  gridBackground: 'ct-grid-background'
};

/**
 * The options of {@link axisGrid} and {@link axisLabels}.
 * @experimental
 */
export interface AxisLayerOptions {
  /**
   * Axis ids to draw; default: all axes, in declaration order. An unknown
   * id throws.
   */
  readonly axes?: readonly string[];
  /** Replaces some of the classes; the others keep their 1.x names. */
  readonly classNames?: Partial<AxisLayerClassNames>;
}

/**
 * The options of {@link axisLabels}: those of every axis layer, plus how
 * the labels are drawn.
 * @experimental
 */
export interface AxisLabelsOptions extends AxisLayerOptions {
  /** HTML (`foreignObject`) or SVG `text`; default: the chart's mode. */
  readonly labels?: LabelMode;
  /**
   * Aligns SVG text labels in their box, on every axis of the layer;
   * default: as the 1.x CSS aligns HTML labels. An axis's own
   * `labelAlign` wins over it. HTML labels ignore it (align them with
   * CSS).
   */
  readonly align?: Partial<LabelAlign>;
}

/** The 1.x axis defaults, for options an axis definition leaves out. */
function drawnOptions(axis: PlacedScaleAxis): DrawnAxisOptions {
  const options = axis.options;
  return {
    ...options,
    offset: options.offset ?? 0,
    position: axis.side === 'top' || axis.side === 'left' ? 'start' : 'end',
    labelOffset: options.labelOffset ?? { x: 0, y: 0 },
    showLabel: options.showLabel ?? true,
    showGrid: options.showGrid ?? true,
    labelTransform: labelTransformOf(options)
  } as DrawnAxisOptions;
}

function selectedAxes(context: LayerContext, ids?: readonly string[]) {
  const all = context.axes.all ?? [];
  if (!ids) {
    return all;
  }
  return ids.map(id => {
    const axis = all.find(candidate => candidate.id === id);
    if (!axis) {
      throw new Error(`Chartist: unknown axis "${id}" in an axis layer`);
    }
    return axis;
  });
}

/**
 * Labels per side, stacked outward by the axis inset. With an inset of 0
 * these are the 1.x formulas of the presets.
 */
export const placeOnSide =
  (side: PlacedScaleAxis['side'], inset: number): LabelPlacer =>
  (axis, relative, labelLength, options, area) =>
    axis.dimension === 'x'
      ? {
          position: area.x1 + relative,
          labelOffset: {
            x: options.labelOffset.x,
            y:
              side === 'top'
                ? area.y2 - inset - options.offset + options.labelOffset.y + 5
                : area.y1 + inset + options.labelOffset.y + 5
          }
        }
      : {
          position: area.y1 - relative,
          labelOffset: {
            x:
              side === 'left'
                ? area.x1 - inset - options.offset + options.labelOffset.x
                : area.x2 + inset + options.labelOffset.x + 10,
            y: options.labelOffset.y - labelLength
          }
        };

function nodesOf(
  axis: PlacedScaleAxis,
  context: LayerContext,
  classNames: AxisLayerClassNames,
  svgLabel?: SvgLabelBuilder
) {
  return axisNodes(axis, {
    svgLabel,
    area: context.area,
    padding: context.padding,
    classNames,
    options: drawnOptions(axis),
    place: placeOnSide(axis.side, axis.inset),
    atStart: axis.side === 'top' || axis.side === 'left'
  });
}

/**
 * Creates a layer that draws the grid lines of the named axes (default:
 * all) in `g.ct-grids`, one `line.ct-grid` per tick. List it first, so
 * the series draw over it.
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
 *   stepAxis
 * } from 'chartist';
 *
 * const hours = ['6am', '9am', '12pm', '3pm', '6pm'];
 *
 * chart('#chart', {
 *   data: { labels: hours, series: [[12, 17, 23, 21, 15]] },
 *   axes: cartesianAxes([
 *     { id: 'time', side: 'bottom', type: stepAxis(), ticks: hours },
 *     { id: 'celsius', side: 'left', type: autoScaleAxis() }
 *   ]),
 *   // Horizontal lines only, on a background rect.
 *   layers: [
 *     axisGrid({ axes: ['celsius'], background: true }),
 *     line(),
 *     axisLabels()
 *   ]
 * });
 * ```
 * @param options The axes to draw and their classes; `background` adds a
 *   `rect.ct-grid-background` over the chart area, behind the lines.
 * @experimental
 */
export function axisGrid(
  options: AxisLayerOptions & { readonly background?: boolean } = {}
): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  return {
    type: 'axisGrid',
    coordinates: ['cartesian'],
    // Draws no series, so it doesn't count toward any axis range.
    series: [],
    compose(context) {
      const lines: SceneNode[] = selectedAxes(context, options.axes).flatMap(
        axis => nodesOf(axis, context, classNames).grids
      );
      if (options.background) {
        lines.unshift(gridBackground(context.area, classNames.gridBackground));
      }
      return [
        withFields(node('g', {}, classNames.gridGroup), { children: lines })
      ];
    }
  };
}

/**
 * Creates a layer that draws the labels of the named axes (default: all)
 * in `g.ct-labels`, each on its axis's side. Axes on the same side stack
 * outward, each in its own `offset`. List it last, so the labels draw
 * over the series.
 *
 * Labels are HTML in a `foreignObject` (as in 1.x) or SVG `text`: the
 * chart's `labels` option decides, unless the layer sets its own.
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
 *   stepAxis
 * } from 'chartist';
 *
 * const weeks = ['W1', 'W2', 'W3', 'W4'];
 *
 * chart('#chart', {
 *   data: { labels: weeks, series: [[3, 5, 4, 8]] },
 *   axes: cartesianAxes([
 *     { id: 'week', side: 'bottom', type: stepAxis(), ticks: weeks },
 *     { id: 'km', side: 'left', type: autoScaleAxis(), low: 0 }
 *   ]),
 *   layers: [
 *     axisGrid(),
 *     line(),
 *     // SVG text instead of HTML, e.g. to export the SVG.
 *     axisLabels({ labels: 'svg' })
 *   ]
 * });
 * ```
 * @experimental
 */
export function axisLabels(options: AxisLabelsOptions = {}): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  return {
    type: 'axisLabels',
    coordinates: ['cartesian'],
    series: [],
    compose(context) {
      const svg = (options.labels ?? context.labels) === 'svg';
      return [
        withFields(node('g', {}, classNames.labelGroup), {
          children: selectedAxes(context, options.axes).flatMap(
            axis =>
              nodesOf(
                axis,
                context,
                classNames,
                svg
                  ? svgLabels(context.measureText, 'line', {
                      ...options.align,
                      ...axis.options.labelAlign
                    })
                  : undefined
              ).labels
          )
        })
      ];
    }
  };
}
