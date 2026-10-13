/**
 * `lineChart`: the 1.x line chart as a preset over `chart()`. Takes the 1.x
 * arguments and options and renders the 1.x structure.
 */
import type {
  LineChartData,
  LineChartOptions
} from '../charts/LineChart/LineChart.types';
import type { Label, ResponsiveOptions } from '../core/types';
import { chart } from '../chart/chart';
import type { ChartConfig, ChartHandle, ChartPlugin } from '../chart/types';
import { line } from '../layers/line';
import type { Layer, LayerContext } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import type { AxisFactory, AxisSetup, AxesConfig } from '../scales/axis';
import { cartesianAxes } from '../scales/cartesian';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import {
  axisNodes,
  gridBackground,
  type AxisFrame,
  type DrawnAxisOptions
} from '../scales/grid';
import { extend } from '../utils/extend';
import { isNumeric } from '../utils/utils';
import { lineDefaults } from './lineDefaults';

type PresetAxisOptions = Omit<
  NonNullable<LineChartOptions['axisX']>,
  'type'
> & {
  /** A v2 axis factory or a 1.x axis class. */
  readonly type?: AxisSetup['type'];
};

/**
 * Options of `lineChart`: the 1.x `LineChart` options; axis types may also
 * be v2 axis factories.
 * @experimental
 */
export type LineChartPresetOptions = Omit<
  LineChartOptions,
  'axisX' | 'axisY'
> & {
  readonly axisX?: PresetAxisOptions;
  readonly axisY?: PresetAxisOptions;
};

type Resolved = typeof lineDefaults & LineChartPresetOptions;

/** The default 1.x X axis: one step per label; `fullWidth` stretches it. */
function labelStepAxis(stretch: boolean): AxisFactory {
  const step = stepAxis();
  return {
    kind: 'step',
    create: context =>
      step.create({
        ...context,
        options: {
          ...context.options,
          ticks: context.labels as Label[],
          stretch
        }
      })
  };
}

function axesConfig(options: Resolved): AxesConfig {
  const { axisX, axisY } = options;
  const x: AxisSetup = {
    ...axisX,
    type: axisX.type ?? labelStepAxis(options.fullWidth)
  };
  const y: AxisSetup =
    axisY.type === undefined
      ? {
          ...axisY,
          type: autoScaleAxis(),
          high: isNumeric(options.high) ? options.high : axisY.high,
          low: isNumeric(options.low) ? options.low : axisY.low
        }
      : { ...axisY, type: axisY.type };
  return { x, y, reverseData: options.reverseData };
}

function frame(options: Resolved, context: LayerContext): AxisFrame {
  return {
    area: context.area,
    padding: context.padding,
    axisX: options.axisX as DrawnAxisOptions,
    axisY: options.axisY as DrawnAxisOptions,
    classNames: options.classNames
  };
}

function group(className: string, children: SceneNode[]) {
  return withFields(node('g', {}, className), { children });
}

/** `g.ct-grids`: X grid lines, Y grid lines, the background first. */
function gridLayer(options: Resolved): Layer {
  return {
    type: 'grid',
    coordinates: ['cartesian'],
    compose(context) {
      const { x, y } = context.axes;
      const lines = [x, y].flatMap(axis =>
        axis ? axisNodes(axis, frame(options, context)).grids : []
      );
      if (options.showGridBackground) {
        lines.unshift(
          gridBackground(context.area, options.classNames.gridBackground)
        );
      }
      return [group(options.classNames.gridGroup, lines)];
    }
  };
}

/** `g.ct-labels`: X labels, then Y labels. */
function labelLayer(options: Resolved): Layer {
  return {
    type: 'labels',
    coordinates: ['cartesian'],
    compose(context) {
      const { x, y } = context.axes;
      return [
        group(
          options.classNames.labelGroup,
          [x, y].flatMap(axis =>
            axis ? axisNodes(axis, frame(options, context)).labels : []
          )
        )
      ];
    }
  };
}

/** The series layer in the unclassed 1.x series group. */
function seriesLayer(options: Resolved): Layer {
  const series = line({
    lineSmooth: options.lineSmooth,
    showPoint: options.showPoint,
    showLine: options.showLine,
    showArea: options.showArea,
    areaBase: options.areaBase,
    series: options.series,
    reverseData: options.reverseData,
    classNames: options.classNames
  });
  return {
    type: 'line',
    coordinates: ['cartesian'],
    compose: context => [group('', [...series.compose(context)])]
  };
}

function config(data: LineChartData, options: Resolved): ChartConfig {
  return {
    data,
    axes: cartesianAxes(axesConfig(options)),
    padding: options.chartPadding,
    width: options.width,
    height: options.height,
    viewBox: options.viewBox,
    className: options.classNames.chart,
    layers: [gridLayer(options), seriesLayer(options), labelLayer(options)]
  };
}

/** Adds the 1.x inline size style to the root svg. */
function rootStyle(getOptions: () => Resolved): ChartPlugin {
  return {
    name: 'line-preset',
    install(handle) {
      handle.on('scene', ({ scene }) => {
        const { width = '100%', height = '100%' } = getOptions();
        return {
          scene: scene.attr({ style: `width: ${width}; height: ${height};` })
        };
      });
    }
  };
}

/** 1.x responsive options: extend with every matching media query, in order. */
function withResponsive(
  base: Resolved,
  responsiveOptions: ResponsiveOptions<LineChartPresetOptions> | undefined
): Resolved {
  let current = extend({}, base) as Resolved;
  if (responsiveOptions && typeof window !== 'undefined' && window.matchMedia) {
    for (const [query, options] of responsiveOptions) {
      if (window.matchMedia(query).matches) {
        current = extend({}, current, options) as Resolved;
      }
    }
  }
  return current;
}

/**
 * Creates a line chart with the 1.x options and output, rendered
 * synchronously.
 * @experimental
 */
export function lineChart(
  target: string | Element,
  data: LineChartData,
  options: LineChartPresetOptions = {},
  responsiveOptions?: ResponsiveOptions<LineChartPresetOptions>
): ChartHandle {
  const base = extend({}, lineDefaults, options) as Resolved;
  let current = withResponsive(base, responsiveOptions);

  const inner = chart(target, {
    ...config(data, current),
    plugins: [
      rootStyle(() => current),
      ...((options.plugins ?? []) as ChartConfig['plugins'] & unknown[])
    ]
  });

  const queries =
    responsiveOptions && typeof window !== 'undefined' && window.matchMedia
      ? responsiveOptions.map(([query]) => window.matchMedia(query))
      : [];
  const onMediaChange = () => {
    current = withResponsive(base, responsiveOptions);
    const { data: _data, ...changes } = config(data, current);
    inner.update(changes);
  };
  queries.forEach(query => query.addEventListener('change', onMediaChange));

  const handle: ChartHandle = {
    update(changes) {
      inner.update(changes);
      return handle;
    },
    destroy() {
      queries.forEach(query =>
        query.removeEventListener('change', onMediaChange)
      );
      inner.destroy();
    },
    on: ((name: never, listener: never) => {
      inner.on(name, listener);
      return handle;
    }) as ChartHandle['on'],
    off: ((name: never, listener?: never) => {
      inner.off(name, listener);
      return handle;
    }) as ChartHandle['off']
  };
  return handle;
}
