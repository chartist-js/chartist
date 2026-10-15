import type { ChartHandle, ChartPlugin, PluginEntry } from '../chart/types';
import { untyped } from '../chart/types';
import { asUserListeners } from '../chart/plugins';
import type { Data, Options, ResponsiveOptions } from '../core';
import type { AllEventsListener, EventListener } from '../event';
import type { PresetController } from '../presets/preset';
import { extend } from '../utils';
import { BaseChart } from './BaseChart';

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
function v2Plugins(plugins: readonly unknown[], chart: object) {
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
 * Base of the 1.x chart classes that wrap a v2 preset. Keeps the 1.x API:
 * deferred first render, `update(data, options, override)`, `detach()`,
 * `on`/`off`, and re-rendering when the window resizes (and, like the chart
 * functions, when the container does). 1.x events and 1.x plugin functions
 * need the compat plugin (`chartist/compat`).
 */
export abstract class PresetChart<
  TEventsTypes,
  TData extends Data,
  TOptions extends Options
> extends BaseChart<TEventsTypes> {
  private controller?: PresetController<TData, TOptions>;
  /** The chart handle while plugins install (before `controller` is set). */
  private installing?: ChartHandle;
  private readonly queued: [string, EventListener | AllEventsListener][] = [];
  private readonly onWindowResize = () => this.update();
  /** Set by detach(), also when a listener of the first render calls it. */
  private detached = false;
  private readonly wildcards = new Map<AllEventsListener, AllEventsListener>();

  constructor(
    query: string | Element | null,
    protected override data: TData,
    defaults: TOptions,
    private chartOptions?: TOptions,
    private readonly chartResponsiveOptions?: ResponsiveOptions<TOptions>
  ) {
    super(
      query,
      data,
      defaults,
      extend({}, defaults, chartOptions),
      chartResponsiveOptions as ResponsiveOptions<Options>
    );
    // 1.x plugins use chart.eventEmitter, e.g. for Svg.animate events.
    Object.defineProperty(this, 'eventEmitter', {
      value: {
        on: (event: string, listener: EventListener) =>
          this.on(event, listener),
        off: (event: string, listener?: EventListener) =>
          this.off(event, listener),
        emit: (event: string, payload: unknown) =>
          this.controller &&
          untyped(this.controller.handle).emit(event, payload)
      }
    });
  }

  /** Creates the preset this class wraps. */
  protected abstract createController(
    container: Element,
    data: TData,
    options: TOptions | undefined,
    responsiveOptions: ResponsiveOptions<TOptions> | undefined,
    plugins: PluginEntry[]
  ): PresetController<TData, TOptions>;

  override initialize() {
    (this as unknown as { initializeTimeoutId: null }).initializeTimeoutId =
      null;
    const queued = this.queued.splice(0);
    const listeners: ChartPlugin = {
      name: 'chart-listeners',
      install: handle => {
        // 1.x plugins call chart.on() while they install.
        this.installing = handle;
        // The queued listeners are the user's, though added from a plugin,
        // so off(name) removes them.
        asUserListeners(handle, () =>
          queued.forEach(([event, listener]) =>
            this.on(event as never, listener as never)
          )
        );
      }
    };
    // Keeps the 1.x fields that plugins read (data, options) current. The
    // compat plugin sets `svg` for 1.x plugins, so the class doesn't need
    // the Svg wrapper.
    const syncFields: ChartPlugin = {
      name: 'chart-fields',
      install: handle =>
        void handle
          // The 1.x classes always draw HTML labels (no v2 features).
          .on('resolve', ({ config }) =>
            config.labels
              ? { config: { ...config, labels: undefined } }
              : undefined
          )
          .on('mount', () => {
            if (this.controller) {
              this.data = this.controller.data();
              (this as unknown as { options: unknown }).options =
                this.controller.options();
            }
          })
    };
    // Added before the first render (as 1.x does), so a detach() from one of
    // its listeners removes it. The container's window may be an iframe's.
    this.container.ownerDocument.defaultView?.addEventListener(
      'resize',
      this.onWindowResize
    );
    this.controller = this.createController(
      this.container,
      this.data,
      this.chartOptions,
      // The 1.x classes keep media queries only (no container()).
      this.chartResponsiveOptions?.filter(
        ([condition]) => typeof condition === 'string'
      ),
      [
        listeners,
        syncFields,
        ...v2Plugins(this.chartOptions?.plugins ?? [], this)
      ]
    );
    this.installing = undefined;
    if (this.detached) {
      this.controller.handle.detach();
    }
  }

  createChart() {
    // Rendering is done by the wrapped preset.
  }

  /**
   * Updates the chart. New options extend the defaults, or the current
   * options when `override` is true (1.x semantics).
   */
  override update(data?: Data, options?: TOptions, override = false) {
    if (data) {
      this.data = data as TData;
    }
    if (options) {
      this.chartOptions = extend(
        {},
        override ? this.chartOptions : {},
        options
      ) as TOptions;
    }
    if (this.controller) {
      if (data) {
        this.controller.setData(data as TData);
      }
      if (options) {
        this.controller.setOptions(options as TOptions, override);
      }
      this.controller.render();
    }
    return this;
  }

  /** Stops resize and media query handling; the chart stays rendered. */
  override detach() {
    super.detach();
    this.detached = true;
    this.container.ownerDocument.defaultView?.removeEventListener(
      'resize',
      this.onWindowResize
    );
    this.controller?.handle.detach();
    return this;
  }

  override on<T extends keyof TEventsTypes>(
    event: T,
    listener: EventListener<TEventsTypes[T]>
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
      untyped(handle).on(event, listener as (payload: unknown) => void);
    }
    return this;
  }

  override off<T extends keyof TEventsTypes>(
    event: T,
    listener?: EventListener<TEventsTypes[T]>
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
      untyped(handle).off(
        event,
        target as ((payload: unknown) => void) | undefined
      );
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
