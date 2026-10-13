import type {
  LineChartData,
  LineChartOptions,
  LineChartOptionsWithDefaults,
  LineChartEventsTypes
} from './LineChart.types';
import type { Data, Series, SeriesObject, ResponsiveOptions } from '../../core';
import type { ChartHandle, ChartPlugin, PluginEntry } from '../../chart/types';
import type { EventListener, AllEventsListener } from '../../event';
import {
  createLineChart,
  type LineChartController,
  type LineChartPresetOptions
} from '../../presets/lineChart';
import { lineDefaults } from '../../presets/lineDefaults';
import { extend, safeHasProperty } from '../../utils';
import { BaseChart } from './../BaseChart';

export function getSeriesOption<
  T extends keyof Omit<LineChartOptionsWithDefaults, 'series'>
>(
  series: Series | SeriesObject,
  options: LineChartOptionsWithDefaults,
  key: T
) {
  if (
    safeHasProperty(series, 'name') &&
    series.name &&
    options.series?.[series.name]
  ) {
    const seriesOptions = options?.series[series.name];
    const value = seriesOptions[key];
    const result = value === undefined ? options[key] : value;

    return result as LineChartOptionsWithDefaults[T];
  } else {
    return options[key];
  }
}

/** What the class needs from the compat plugin to run 1.x plugins. */
interface LegacyPluginRunner {
  legacyPlugin(
    plugin: (chart: unknown, options?: unknown) => void,
    options: unknown,
    chart: unknown
  ): ChartPlugin;
}

const warnedPlugins = new Set<unknown>();

const PHASES = new Set([
  'resolve',
  'prepare',
  'layout',
  'compose',
  'scene',
  'render',
  'mount'
]);

/**
 * Splits 1.x plugin options into v2 plugins. Plugin functions run through
 * the compat plugin (found by duck typing, so the class never imports it),
 * or are skipped with a one-time warning.
 */
function v2Plugins(plugins: readonly unknown[], chart: LineChart) {
  const runner = plugins.find(
    (entry): entry is LegacyPluginRunner =>
      typeof (entry as Partial<LegacyPluginRunner> | null)?.legacyPlugin ===
      'function'
  );
  return plugins.flatMap(entry => {
    const [plugin, options] = Array.isArray(entry) ? entry : [entry];
    if (typeof plugin !== 'function') {
      return [entry as PluginEntry];
    }
    if (runner) {
      return [runner.legacyPlugin(plugin, options, chart)];
    }
    if (!warnedPlugins.has(plugin)) {
      warnedPlugins.add(plugin);
      // Intentional: tells 1.x users how to migrate.
      // eslint-disable-next-line no-console
      console.warn(
        `Chartist: the plugin "${plugin.name || 'anonymous'}" looks like a 1.x plugin (a plain function) and was skipped. 1.x plugins run only with the compat plugin: add compat from chartist/compat to plugins.`
      );
    }
    return [];
  });
}

/**
 * The 1.x line chart class. It wraps the `lineChart` preset and keeps the
 * 1.x API: deferred first render, `update(data, options, override)`,
 * `detach()`, `on`/`off`, and re-rendering on window resize. 1.x events and
 * 1.x plugin functions need the compat plugin (`chartist/compat`).
 * @see lineChart for the v2 functional API.
 */
export class LineChart extends BaseChart<LineChartEventsTypes> {
  private controller?: LineChartController;
  /** The chart handle while plugins install (before `controller` is set). */
  private installing?: ChartHandle;
  private readonly queued: [string, EventListener | AllEventsListener][] = [];
  private readonly onWindowResize = () => this.update();
  private readonly wildcards = new Map<AllEventsListener, AllEventsListener>();

  /**
   * Creates a line chart. The first render happens on the next tick, so
   * listeners registered right after construction receive it.
   * @param query A selector query string or a DOM element
   * @param data The data with labels and series
   * @param options Options that override the defaults
   * @param responsiveOptions `[mediaQuery, options]` pairs
   */
  constructor(
    query: string | Element | null,
    protected override data: LineChartData,
    private chartOptions?: LineChartOptions,
    private readonly chartResponsiveOptions?: ResponsiveOptions<LineChartOptions>
  ) {
    super(
      query,
      data,
      lineDefaults,
      extend({}, lineDefaults, chartOptions),
      chartResponsiveOptions
    );
    // 1.x plugins use chart.eventEmitter, e.g. for Svg.animate events.
    Object.defineProperty(this, 'eventEmitter', {
      value: {
        on: (event: string, listener: EventListener) =>
          this.on(event, listener),
        off: (event: string, listener?: EventListener) =>
          this.off(event, listener),
        emit: (event: string, payload: unknown) =>
          this.controller?.handle.emit(event, payload)
      }
    });
  }

  override initialize() {
    (this as unknown as { initializeTimeoutId: null }).initializeTimeoutId =
      null;
    const queued = this.queued.splice(0);
    const listeners: ChartPlugin = {
      name: 'line-chart-listeners',
      install: handle => {
        // 1.x plugins call chart.on() while they install.
        this.installing = handle;
        queued.forEach(([event, listener]) =>
          this.on(event as never, listener as never)
        );
      }
    };
    // Keeps the 1.x fields that plugins read (data, options) current. The
    // compat plugin sets `svg` for 1.x plugins, so the class doesn't need
    // the Svg wrapper.
    const syncFields: ChartPlugin = {
      name: 'line-chart-fields',
      install: handle =>
        void handle.on('mount', () => {
          if (this.controller) {
            this.data = this.controller.data();
            (this as unknown as { options: unknown }).options =
              this.controller.options();
          }
        })
    };
    this.controller = createLineChart(
      this.container,
      this.data,
      this.chartOptions as LineChartPresetOptions,
      this.chartResponsiveOptions as ResponsiveOptions<LineChartPresetOptions>,
      [
        listeners,
        syncFields,
        ...v2Plugins(this.chartOptions?.plugins ?? [], this)
      ]
    );
    this.installing = undefined;
    window.addEventListener('resize', this.onWindowResize);
  }

  createChart() {
    // Rendering is done by the lineChart preset.
  }

  /**
   * Updates the chart. New options extend the defaults, or the current
   * options when `override` is true (1.x semantics).
   */
  override update(data?: Data, options?: LineChartOptions, override = false) {
    if (data) {
      this.data = data as LineChartData;
    }
    if (options) {
      this.chartOptions = extend(
        {},
        override ? this.chartOptions : {},
        options
      ) as LineChartOptions;
    }
    if (this.controller) {
      if (data) {
        this.controller.setData(data as LineChartData);
      }
      if (options) {
        this.controller.setOptions(options as LineChartPresetOptions, override);
      }
      this.controller.render();
    }
    return this;
  }

  /** Stops resize and media query handling; the chart stays rendered. */
  override detach() {
    super.detach();
    window.removeEventListener('resize', this.onWindowResize);
    this.controller?.handle.detach();
    return this;
  }

  override on<T extends keyof LineChartEventsTypes>(
    event: T,
    listener: EventListener<LineChartEventsTypes[T]>
  ): this;
  override on(event: '*', listener: AllEventsListener): this;
  override on(event: string, listener: EventListener): this;
  override on(event: string, listener: EventListener | AllEventsListener) {
    const handle = this.controller?.handle ?? this.installing;
    if (!handle) {
      this.queued.push([event, listener]);
    } else if (event === '*') {
      // As 1.x: '*' listeners receive chart events, not the v2 phases.
      const wildcard = listener as AllEventsListener;
      const filtered: AllEventsListener = (name, payload) => {
        if (!PHASES.has(name)) {
          wildcard(name, payload);
        }
      };
      this.wildcards.set(wildcard, filtered);
      handle.on('*', filtered);
    } else {
      handle.on(event, listener as (payload: unknown) => void);
    }
    return this;
  }

  override off<T extends keyof LineChartEventsTypes>(
    event: T,
    listener?: EventListener<LineChartEventsTypes[T]>
  ): this;
  override off(event: '*', listener?: AllEventsListener): this;
  override off(event: string, listener?: EventListener): this;
  override off(event: string, listener?: EventListener | AllEventsListener) {
    const handle = this.controller?.handle ?? this.installing;
    if (handle) {
      const target =
        event === '*' && listener
          ? this.wildcards.get(listener as AllEventsListener)
          : listener;
      handle.off(event, target as ((payload: unknown) => void) | undefined);
    } else {
      const index = this.queued.findIndex(
        ([name, queuedListener]) =>
          name === event && (!listener || queuedListener === listener)
      );
      if (listener && index >= 0) {
        this.queued.splice(index, 1);
      } else if (!listener) {
        this.queued.splice(
          0,
          this.queued.length,
          ...this.queued.filter(([name]) => name !== event)
        );
      }
    }
    return this;
  }
}
