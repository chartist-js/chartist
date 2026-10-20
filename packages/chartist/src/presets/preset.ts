/**
 * Shared machinery of the 1.x presets (`lineChart`, `barChart`, …): the 1.x
 * option merge, window responsive options, the preset state that plugins
 * (compat) read, and the grid and label layers.
 */
import { chart } from '../chart/chart';
import type { ChartConfig, ChartHandle, ChartPlugin } from '../chart/types';
import { untyped } from '../chart/types';
import type { Layer, LayerContext, PhaseListeners } from '../pipeline/types';
import { node, withFields, type SceneNode } from '../scene/node';
import type { AxisOptions } from '../core/types';
import type { AxisDimension, AxisSetup } from '../scales/axis';
import {
  axisNodes,
  gridBackground,
  type AxisClassNames,
  type AxisFrame,
  type DrawnAxisOptions
} from '../scales/grid';
import { labelTransformOf } from '../layers/label';
import {
  svgLabels,
  type LabelChartKind,
  type SvgLabelBuilder
} from '../scales/svgLabels';
import {
  applyResponsive,
  watchResponsive,
  type ResponsiveEntry
} from '../responsive/responsive';
import { extend } from '../utils/extend';

/**
 * What a preset passes to plugins as `ResolvedConfig.preset`: its kind, the
 * current 1.x options and 1.x-style updates.
 */
export interface PresetState<
  TData = unknown,
  TOptions = unknown,
  TKind extends string = string
> {
  /** Which preset: `line`, `bar` or `pie`. */
  readonly kind: TKind;
  /**
   * The current options: the given ones over the defaults, with the
   * matching responsive options applied.
   */
  readonly options: TOptions;
  /** The current data. */
  readonly data: TData;
  /**
   * Changes the data, the options or both and redraws, as 1.x `update()`:
   * the options extend the current ones, or with `override`, the defaults.
   */
  update(data?: TData, options?: TOptions, override?: boolean): void;
  /** Stops the chart's responsive updates, as 1.x `detach()`. */
  detach(): void;
}

/**
 * The handle `lineChart`, `barChart` and `pieChart` return: a
 * {@link ChartHandle} that also changes the chart's options.
 * `update({ data })` changes the preset's data too, so responsive changes
 * redraw with it.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 *
 * const chart = lineChart('#chart', { series: [[1, 3, 2, 5]] });
 *
 * // Areas from now on; the other options stay.
 * chart.setOptions({ showArea: true });
 * ```
 */
export interface PresetHandle<TOptions> extends ChartHandle {
  /**
   * Changes the options and redraws: they extend the current options, or
   * with `{ replace: true }`, the defaults, dropping the options given
   * before. Matching responsive options still apply on top. `plugins`,
   * `on` and `renderer` can't change. Coming from 1.x, `setOptions(options)` is
   * `update(undefined, options, true)` and
   * `setOptions(options, { replace: true })` is `update(undefined, options)`.
   * @param options The options to change.
   * @param how `replace: true` starts from the defaults instead of the
   * current options.
   */
  setOptions(
    options: Omit<TOptions, 'plugins' | 'on' | 'renderer'>,
    how?: { readonly replace?: boolean }
  ): this;
}

/** Internal: a preset with 1.x-style data and option updates. */
export interface PresetController<TData, TOptions> {
  readonly handle: PresetHandle<TOptions>;
  /** Replaces the data (1.x `update(data)`); call `render()` after. */
  setData(data: TData): void;
  /** 1.x option update: extends the defaults, or the current options. */
  setOptions(options: TOptions, override?: boolean): void;
  render(): void;
  options(): TOptions;
  data(): TData;
}

/** 1.x axis options whose `type` may also be a v2 axis factory. */
export type PresetAxisOptions = Omit<AxisOptions, 'type'> & {
  /** A v2 axis factory or a 1.x axis class. */
  readonly type?: AxisSetup['type'];
};

/**
 * Extra layers of a preset chart, such as `band()` or the target and
 * trend lines of `@chartist-js/essentials`: they draw on the preset's
 * axes and get all series.
 * @example
 * ```ts
 * import { barChart, band } from 'chartist';
 *
 * barChart(
 *   '#chart',
 *   { labels: ['Q1', 'Q2', 'Q3'], series: [[800, 1200, 950]] },
 *   { layers: { below: [band({ low: 800, high: 1200 })] } }
 * );
 * ```
 */
export interface PresetLayers {
  /** Layers drawn above the grid and below the chart's series. */
  readonly below?: readonly Layer[];
  /** Layers drawn above the chart's series and below the axis labels. */
  readonly above?: readonly Layer[];
}

/** What a chart type contributes to `createPreset`. */
export interface PresetSpec<TData, TOptions> {
  readonly kind: string;
  readonly defaults: object;
  /** The `chart()` config for the data and the merged 1.x options. */
  config(data: TData, options: TOptions): ChartConfig;
}

interface ClassNames extends AxisClassNames {
  readonly gridGroup: string;
  readonly labelGroup: string;
  readonly gridBackground: string;
}

/** 1.x options with the defaults applied, as the shared layers need them. */
export interface AxisPresetOptions {
  readonly axisX: DrawnAxisOptions;
  readonly axisY: DrawnAxisOptions;
  readonly showGridBackground?: boolean;
  readonly classNames: ClassNames;
  /** Which 1.x label CSS row SVG text labels follow. */
  readonly labelKind?: LabelChartKind;
}

/** An axis's options with its label function resolved from either name. */
const drawn = (axis: DrawnAxisOptions): DrawnAxisOptions => ({
  ...axis,
  labelTransform: labelTransformOf(axis)
});

function frame(
  options: AxisPresetOptions,
  context: LayerContext,
  svgLabel?: SvgLabelBuilder
): AxisFrame {
  return {
    svgLabel,
    area: context.area,
    padding: context.padding,
    axisX: drawn(options.axisX),
    axisY: drawn(options.axisY),
    classNames: options.classNames
  };
}

export function group(className: string, children: SceneNode[]) {
  return withFields(node('g', {}, className), { children });
}

/** `g.ct-grids`: grid lines per axis in `order`, the background first. */
export function gridLayer(
  options: AxisPresetOptions,
  order: readonly AxisDimension[] = ['x', 'y']
): Layer {
  return {
    type: 'grid',
    coordinates: ['cartesian'],
    compose(context) {
      const lines = order.flatMap(dimension => {
        const axis = context.axes[dimension];
        return axis ? axisNodes(axis, frame(options, context)).grids : [];
      });
      if (options.showGridBackground) {
        lines.unshift(
          gridBackground(context.area, options.classNames.gridBackground)
        );
      }
      return [group(options.classNames.gridGroup, lines)];
    }
  };
}

/** `g.ct-labels`: labels per axis in `order`. */
export function labelLayer(
  options: AxisPresetOptions,
  order: readonly AxisDimension[] = ['x', 'y']
): Layer {
  return {
    type: 'labels',
    coordinates: ['cartesian'],
    compose(context) {
      return [
        group(
          options.classNames.labelGroup,
          order.flatMap(dimension => {
            const axis = context.axes[dimension];
            if (!axis) {
              return [];
            }
            const svgLabel =
              context.labels === 'svg'
                ? svgLabels(
                    context.measureText,
                    options.labelKind ?? 'line',
                    options[dimension === 'x' ? 'axisX' : 'axisY'].labelAlign
                  )
                : undefined;
            return axisNodes(axis, frame(options, context, svgLabel)).labels;
          })
        )
      ];
    }
  };
}

/**
 * Wraps a layer's output in the unclassed 1.x series group; everything
 * else about the layer (its series, axes, extent) stays.
 */
export function seriesGroup(layer: Layer): Layer {
  return {
    ...layer,
    compose: context => [group('', [...layer.compose(context)])]
  };
}

/**
 * The property of a preset's chart handle that holds its {@link PresetState}
 * from the moment plugins install, before the first `resolve` hands it over
 * in the config. The compat plugin reads it to give 1.x plugins the chart's
 * data and options while they install, as 1.x did. A global symbol, so
 * separate builds of the core and `chartist/compat` share it.
 */
export const PRESET_STATE = Symbol.for('chartist.presetState');

/**
 * Adds the 1.x inline size style to the root svg. Installed first, it also
 * puts the preset state on the handle for the plugins after it.
 */
function rootStyle(
  getOptions: () => { width?: number | string; height?: number | string },
  state: PresetState
): ChartPlugin {
  return {
    name: 'preset-root-style',
    install(handle) {
      Object.defineProperty(handle, PRESET_STATE, { value: state });
      handle.on('scene', ({ scene }) => {
        const { width = '100%', height = '100%' } = getOptions();
        return {
          scene: scene.attr({ style: `width: ${width}; height: ${height};` })
        };
      });
    }
  };
}

/**
 * Internal: a preset's chart config for data and options, without a
 * container. The options extend the preset's defaults as in
 * `createPreset`; the root gets no inline size style, which only sizes the
 * svg in a container.
 */
export function presetConfig<
  TData extends { labels?: unknown[]; series?: unknown[] },
  TOptions
>(
  spec: PresetSpec<TData, TOptions>,
  data: TData,
  options?: TOptions
): ChartConfig {
  const resolved = extend({}, spec.defaults, options) as TOptions;
  const { plugins, on, renderer } = (options ?? {}) as Pick<
    ChartConfig,
    'plugins' | 'on' | 'renderer'
  >;
  return {
    // As 1.x: missing labels and series are empty.
    ...spec.config(
      { ...data, labels: data.labels || [], series: data.series || [] },
      resolved
    ),
    plugins,
    on,
    ...(renderer && { renderer })
  };
}

/**
 * Responsive options of presets: the 1.x media query pairs, plus container
 * conditions (`container()`). Matching entries extend the options in order.
 */
export type PresetResponsiveOptions<T> = readonly ResponsiveEntry<T>[];

/** Internal: creates a preset chart; used by the preset functions and classes. */
export function createPreset<
  TData extends { labels?: unknown[]; series?: unknown[] },
  TOptions extends { width?: number | string; height?: number | string }
>(
  spec: PresetSpec<TData, TOptions>,
  target: string | Element,
  initialData: TData,
  options: TOptions = {} as TOptions,
  responsiveOptions?: PresetResponsiveOptions<TOptions>,
  plugins: ChartConfig['plugins'] = (options as { plugins?: unknown })
    .plugins as ChartConfig['plugins']
): PresetController<TData, TOptions> {
  let data = initialData;
  let base = extend({}, spec.defaults, options) as TOptions;
  // Created before the chart: on a resize that crosses a container
  // breakpoint, its callback runs first and renders the new size once.
  const watcher = watchResponsive(
    responsiveOptions ?? [],
    (typeof target === 'string' ? document.querySelector(target) : target) ??
      undefined,
    () => onResponsiveChange(),
    true
  );
  const withResponsive = (baseOptions: TOptions) =>
    applyResponsive(
      extend({}, baseOptions) as TOptions,
      responsiveOptions as PresetResponsiveOptions<Partial<TOptions>>,
      watcher.matching,
      (result, overrides) => extend({}, result, overrides) as TOptions
    );
  let current = withResponsive(base);

  const withState = (config: ChartConfig): ChartConfig => ({
    ...config,
    // Generic here; each preset's spec gives its own kind, data and options.
    preset: state as ChartConfig['preset']
  });

  const controller: PresetController<TData, TOptions> = {
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
      base = extend({}, override ? base : spec.defaults, next) as TOptions;
      current = withResponsive(base);
    },
    render() {
      inner.update(withState(spec.config(data, current)));
    },
    options: () => current,
    data: () => data
  };

  const state: PresetState<TData, TOptions> = {
    kind: spec.kind,
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
    // A detach() during the first render (from a listener or a 1.x plugin)
    // runs before the handle exists, so it's applied once it does.
    detach: () => {
      if (ready) {
        handle.detach();
      } else {
        detachedEarly = true;
      }
    }
  };
  let ready = false;
  let detachedEarly = false;

  const inner = chart(target, {
    ...withState(spec.config(data, current)),
    plugins: [rootStyle(() => current, state), ...(plugins ?? [])],
    on: (options as { on?: PhaseListeners }).on,
    renderer: (options as { renderer?: ChartConfig['renderer'] }).renderer
  });

  function onResponsiveChange() {
    const previousOptions = current;
    current = withResponsive(base);
    inner.emit('responsive', { previousOptions, currentOptions: current });
    controller.render();
  }

  const handle: PresetHandle<TOptions> = {
    container: inner.container,
    update(changes) {
      // Kept as the preset's data, so responsive changes and plugins
      // reading the preset state (compat) see it.
      if (changes.data) {
        data = changes.data as TData;
      }
      inner.update(changes);
      return handle;
    },
    setOptions(next, how) {
      // The controller's flag is 1.x's: true extends the current options.
      controller.setOptions(next as TOptions, !how?.replace);
      controller.render();
      return handle;
    },
    detach() {
      watcher.stop();
      inner.detach();
      return handle;
    },
    destroy() {
      handle.detach();
      inner.destroy();
    },
    emit: (name, payload) => untyped(inner).emit(name, payload),
    on: ((name: never, listener: never) => {
      inner.on(name, listener);
      return handle;
    }) as PresetHandle<TOptions>['on'],
    off: ((name: never, listener?: never) => {
      inner.off(name, listener);
      return handle;
    }) as PresetHandle<TOptions>['off']
  };
  ready = true;
  if (detachedEarly) {
    handle.detach();
  }
  return controller;
}
