import type { Data, Options, DataEvent, ResponsiveOptions } from '../core';
import type { Svg } from '../svg';
import type { BaseChartEventsTypes } from './types';
import { OptionsProvider, optionsProvider } from '../core';
import { extend } from '../utils';
import { EventListener, AllEventsListener, EventEmitter } from '../event';

const instances = new WeakMap<Element, BaseChart<unknown>>();

export abstract class BaseChart<TEventsTypes = BaseChartEventsTypes> {
  protected svg?: Svg;
  protected readonly container: Element;
  protected readonly eventEmitter = new EventEmitter();
  private readonly resizeListener = () => this.update();
  // Using event loop for first draw to make it possible to register event listeners in the same call stack where
  // the chart was created.
  private initializeTimeoutId: NodeJS.Timer | null = setTimeout(
    () => this.initialize(),
    0
  );
  private optionsProvider?: OptionsProvider<Options>;

  constructor(
    query: string | Element | null,
    protected data: Data,
    private readonly defaultOptions: Options,
    private options: Options,
    private readonly responsiveOptions?: ResponsiveOptions<Options>
  ) {
    const container =
      typeof query === 'string' ? document.querySelector(query) : query;

    if (!container) {
      throw new Error('Target element is not found');
    }

    this.container = container;

    const prevInstance = instances.get(container);

    // If chartist was already initialized in this container we are detaching all event listeners first
    if (prevInstance) {
      prevInstance.detach();
    }

    instances.set(container, this);
  }

  abstract createChart(options: Options): void;

  // TODO: Currently we need to re-draw the chart on window resize. This is usually very bad and will affect performance.
  // This is done because we can't work with relative coordinates when drawing the chart because SVG Path does not
  // work with relative positions yet. We need to check if we can do a viewBox hack to switch to percentage.
  // See http://mozilla.6506.n7.nabble.com/Specyfing-paths-with-percentages-unit-td247474.html
  // Update: can be done using the above method tested here: http://codepen.io/gionkunz/pen/KDvLj
  // The problem is with the label offsets that can't be converted into percentage and affecting the chart container
  /**
   * Updates the chart which currently does a full reconstruction of the SVG DOM
   * @param data Optional data you'd like to set for the chart before it will update. If not specified the update method will use the data that is already configured with the chart.
   * @param options Optional options you'd like to add to the previous options for the chart before it will update. If not specified the update method will use the options that have been already configured with the chart.
   * @param override If set to true, the passed options will be used to extend the options that have been configured already. Otherwise the chart default options will be used as the base
   */
  update(data?: Data, options?: Options, override = false) {
    if (data) {
      this.data = data || {};
      this.data.labels = this.data.labels || [];
      this.data.series = this.data.series || [];
      // Event for data transformation that allows to manipulate the data before it gets rendered in the charts
      this.eventEmitter.emit<DataEvent>('data', {
        type: 'update',
        data: this.data
      });
    }

    if (options) {
      this.options = extend(
        {},
        override ? this.options : this.defaultOptions,
        options
      );

      // If chartist was not initialized yet, we just set the options and leave the rest to the initialization
      // Otherwise we re-create the optionsProvider at this point
      if (!this.initializeTimeoutId) {
        this.optionsProvider?.removeMediaQueryListeners();
        this.optionsProvider = optionsProvider(
          this.options,
          this.responsiveOptions,
          this.eventEmitter
        );
      }
    }

    // Only re-created the chart if it has been initialized yet
    if (!this.initializeTimeoutId && this.optionsProvider) {
      this.createChart(this.optionsProvider.getCurrentOptions());
    }

    // Return a reference to the chart object to chain up calls
    return this;
  }

  /**
   * This method can be called on the API object of each chart and will un-register all event listeners that were added to other components. This currently includes a window.resize listener as well as media query listeners if any responsive options have been provided. Use this function if you need to destroy and recreate Chartist charts dynamically.
   */
  detach() {
    // Only detach if initialization already occurred on this chart. If this chart still hasn't initialized (therefore
    // the initializationTimeoutId is still a valid timeout reference, we will clear the timeout
    if (!this.initializeTimeoutId) {
      window.removeEventListener('resize', this.resizeListener);
      this.optionsProvider?.removeMediaQueryListeners();
    } else {
      window.clearTimeout(this.initializeTimeoutId);
    }

    instances.delete(this.container);

    return this;
  }

  /**
   * Use this function to register event handlers. The handler callbacks are synchronous and will run in the main thread rather than the event loop.
   * @param event Name of the event. Check the examples for supported events.
   * @param listener The handler function that will be called when an event with the given name was emitted. This function will receive a data argument which contains event data. See the example for more details.
   */
  on<T extends keyof TEventsTypes>(
    event: T,
    listener: EventListener<TEventsTypes[T]>
  ): this;
  on(event: '*', listener: AllEventsListener): this;
  on(event: string, listener: EventListener): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, listener: any) {
    this.eventEmitter.on(event, listener);
    return this;
  }

  /**
   * Use this function to un-register event handlers. If the handler function parameter is omitted all handlers for the given event will be un-registered.
   * @param event Name of the event for which a handler should be removed
   * @param listener The handler function that that was previously used to register a new event handler. This handler will be removed from the event handler list. If this parameter is omitted then all event handlers for the given event are removed from the list.
   */
  off<T extends keyof TEventsTypes>(
    event: T,
    listener?: EventListener<TEventsTypes[T]>
  ): this;
  off(event: '*', listener?: AllEventsListener): this;
  off(event: string, listener?: EventListener): this;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  off(event: string, listener?: any) {
    this.eventEmitter.off(event, listener);
    return this;
  }

  initialize() {
    // Add window resize listener that re-creates the chart
    window.addEventListener('resize', this.resizeListener);

    // Obtain current options based on matching media queries (if responsive options are given)
    // This will also register a listener that is re-creating the chart based on media changes
    this.optionsProvider = optionsProvider(
      this.options,
      this.responsiveOptions,
      this.eventEmitter
    );
    // Register options change listener that will trigger a chart update
    this.eventEmitter.on('optionsChanged', () => this.update());

    // Before the first chart creation we need to register us with all plugins that are configured
    // Initialize all relevant plugins with our chart object and the plugin options specified in the config
    if (this.options.plugins) {
      this.options.plugins.forEach(plugin => {
        if (Array.isArray(plugin)) {
          plugin[0](this, plugin[1]);
        } else {
          plugin(this);
        }
      });
    }

    // Event for data transformation that allows to manipulate the data before it gets rendered in the charts
    this.eventEmitter.emit<DataEvent>('data', {
      type: 'initial',
      data: this.data
    });

    // Create the first chart
    this.createChart(this.optionsProvider.getCurrentOptions());

    // As chart is initialized from the event loop now we can reset our timeout reference
    // This is important if the chart gets initialized on the same element twice
    this.initializeTimeoutId = null;
  }
}
