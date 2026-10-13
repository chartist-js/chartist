/**
 * Grid and label layers for composed charts: `axisGrid()` and
 * `axisLabels()` draw the axes of `cartesianAxes()` with the 1.x geometry
 * and classes, so 1.x CSS applies.
 */
import type { Layer, LayerContext } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import type { PlacedScaleAxis } from '../scales/axis';
import {
  axisNodes,
  gridBackground,
  type AxisClassNames,
  type DrawnAxisOptions,
  type LabelPlacer
} from '../scales/grid';

export interface AxisLayerClassNames extends AxisClassNames {
  readonly gridGroup: string;
  readonly labelGroup: string;
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

/** @experimental */
export interface AxisLayerOptions {
  /** Axis ids to draw; default: all axes, in declaration order. */
  readonly axes?: readonly string[];
  readonly classNames?: Partial<AxisLayerClassNames>;
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
    labelInterpolationFnc:
      options.labelInterpolationFnc ?? ((value: unknown) => value as never)
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
  classNames: AxisLayerClassNames
) {
  return axisNodes(axis, {
    area: context.area,
    padding: context.padding,
    classNames,
    options: drawnOptions(axis),
    place: placeOnSide(axis.side, axis.inset),
    atStart: axis.side === 'top' || axis.side === 'left'
  });
}

/**
 * Grid lines of the named axes (default: all) in `g.ct-grids`.
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
 * Labels of the named axes (default: all) in `g.ct-labels`.
 * @experimental
 */
export function axisLabels(options: AxisLayerOptions = {}): Layer {
  const classNames = { ...CLASS_NAMES, ...options.classNames };
  return {
    type: 'axisLabels',
    coordinates: ['cartesian'],
    series: [],
    compose(context) {
      return [
        withFields(node('g', {}, classNames.labelGroup), {
          children: selectedAxes(context, options.axes).flatMap(
            axis => nodesOf(axis, context, classNames).labels
          )
        })
      ];
    }
  };
}
