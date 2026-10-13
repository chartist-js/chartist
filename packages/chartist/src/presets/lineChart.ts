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

function config(
  data: LineChartData,
  options: Resolved,
  preset?: LinePresetState
): ChartConfig {
  return {
    data,
    preset,
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
 * What the line preset passes to plugins as `ResolvedConfig.preset`: the
 * current 1.x options and 1.x-style updates.
 */
export interface LinePresetState {
  readonly kind: 'line';
  readonly options: LineChartPresetOptions;
  readonly data: LineChartData;
  update(
    data?: LineChartData,
    options?: LineChartPresetOptions,
    override?: boolean
  ): void;
  detach(): void;
}

/** Internal: the preset with 1.x-style data and option updates. */
export interface LineChartController {
  readonly handle: ChartHandle;
  /** Replaces the data (1.x `update(data)`); call `render()` after. */
  setData(data: LineChartData): void;
  /** 1.x option update: extends the defaults, or the current options. */
  setOptions(options: LineChartPresetOptions, override?: boolean): void;
  render(): void;
  options(): LineChartPresetOptions;
  data(): LineChartData;
}

/** Internal: creates the line preset; used by `lineChart` and `LineChart`. */
export function createLineChart(
  target: string | Element,
  initialData: LineChartData,
  options: LineChartPresetOptions = {},
  responsiveOptions?: ResponsiveOptions<LineChartPresetOptions>,
  plugins: ChartConfig['plugins'] = options.plugins as ChartConfig['plugins']
): LineChartController {
  let data = initialData;
  let base = extend({}, lineDefaults, options) as Resolved;
  let current = withResponsive(base, responsiveOptions);

  const queries =
    responsiveOptions && typeof window !== 'undefined' && window.matchMedia
      ? responsiveOptions.map(([query]) => window.matchMedia(query))
      : [];

  const controller: LineChartController = {
    get handle() {
      return handle;
    },
    setData(next) {
      // As 1.x: missing labels and series default to empty arrays.
      next.labels = next.labels || [];
      next.series = next.series || [];
      data = next;
    },
    setOptions(next, override = false) {
      base = extend({}, override ? base : lineDefaults, next) as Resolved;
      current = withResponsive(base, responsiveOptions);
    },
    render() {
      inner.update(config(data, current, state));
    },
    options: () => current,
    data: () => data
  };

  const state: LinePresetState = {
    kind: 'line',
    get options() {
      return current;
    },
    get data() {
      return data;
    },
    update(nextData, nextOptions, override) {
      if (nextData) {
        controller.setData(nextData);
      }
      if (nextOptions) {
        controller.setOptions(nextOptions, override);
      }
      controller.render();
    },
    detach: () => handle.detach()
  };

  const inner = chart(target, {
    ...config(data, current, state),
    plugins: [rootStyle(() => current), ...(plugins ?? [])]
  });

  const onMediaChange = () => {
    const previousOptions = current;
    current = withResponsive(base, responsiveOptions);
    inner.emit('responsive', { previousOptions, currentOptions: current });
    controller.render();
  };
  queries.forEach(query => query.addEventListener('change', onMediaChange));

  const handle: ChartHandle = {
    container: inner.container,
    update(changes) {
      inner.update(changes);
      return handle;
    },
    detach() {
      queries.forEach(query =>
        query.removeEventListener('change', onMediaChange)
      );
      inner.detach();
      return handle;
    },
    destroy() {
      handle.detach();
      inner.destroy();
    },
    emit: (name, payload) => inner.emit(name, payload),
    on: ((name: never, listener: never) => {
      inner.on(name, listener);
      return handle;
    }) as ChartHandle['on'],
    off: ((name: never, listener?: never) => {
      inner.off(name, listener);
      return handle;
    }) as ChartHandle['off']
  };
  return controller;
}

/**
 * Creates a line chart with the 1.x options and output, rendered
 * synchronously. Plugins must be v2 plugins; convert 1.x plugins with
 * `fromLegacyPlugin` from `chartist/compat`.
 * @experimental
 */
export function lineChart(
  target: string | Element,
  data: LineChartData,
  options: LineChartPresetOptions = {},
  responsiveOptions?: ResponsiveOptions<LineChartPresetOptions>
): ChartHandle {
  return createLineChart(target, data, options, responsiveOptions).handle;
}
