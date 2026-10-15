/**
 * The types of the 1.x events and plugins, for code that turns them on with
 * the compat plugin. Each is an alias of the core type of the same name:
 * `chartist` marks those as deprecated (they leave it in 3.0), and an alias
 * is a declaration of its own, so importing from `chartist/compat` shows no
 * deprecation.
 */
import type * as Core from '../index';
import type { Options } from '../index';

/**
 * The 1.x `draw` event of an area (with `showArea`), one per series and
 * segment. `index` is the series' index and `meta` the series' meta.
 */
export type AreaDrawEvent = Core.AreaDrawEvent;

/** The 1.x `draw` events of the axes: grid lines, the grid background and labels. */
export type AxesDrawEvent = Core.AxesDrawEvent;

/** The payload of a bar chart's 1.x `created` event. */
export type BarChartCreatedEvent = Core.BarChartCreatedEvent;

/**
 * The 1.x `draw` event of a bar, one per value. The bar is a `line` element
 * from its base (`x1`, `y1`) to its value (`x2`, `y2`).
 */
export type BarDrawEvent = Core.BarDrawEvent;

/**
 * The payload of the 1.x `created` event, emitted once a chart is drawn:
 * its SVG, drawing area, axes and options.
 */
export type CreatedEvent<TOptions = Options> = Core.CreatedEvent<TOptions>;

/**
 * The payload of the 1.x `data` event, emitted before a chart draws new
 * data. Listeners may change `data` in place to transform it.
 */
export type DataEvent = Core.DataEvent;

/**
 * The fields every 1.x `draw` event shares. A `draw` listener gets one per
 * element drawn; check `type` to tell them apart.
 */
export type DrawEvent = Core.DrawEvent;

/**
 * The 1.x `draw` event of the grid background, the `rect` behind the
 * drawing area (with `showGridBackground`).
 */
export type GridBackgroundDrawEvent = Core.GridBackgroundDrawEvent;

/**
 * The 1.x `draw` event of a grid line, one per tick of each axis. `x1`,
 * `y1`, `x2`, `y2` are the line's ends in px.
 */
export type GridDrawEvent = Core.GridDrawEvent;

/**
 * The 1.x `draw` event of an axis label, one per tick. The label is a
 * `foreignObject` with a `span`, placed at `x`, `y` with the given size.
 */
export type LabelDrawEvent = Core.LabelDrawEvent;

/** The payload of a line chart's 1.x `created` event. */
export type LineChartCreatedEvent = Core.LineChartCreatedEvent;

/**
 * The 1.x `draw` event of a line, one per series. `index` is the series'
 * index and `meta` the series' meta.
 */
export type LineDrawEvent = Core.LineDrawEvent;

/**
 * The payload of the 1.x `optionsChanged` event, emitted when a responsive
 * option starts or stops applying.
 */
export type OptionsChangedEvent<T = Options> = Core.OptionsChangedEvent<T>;

/** The payload of a pie chart's 1.x `created` event: as for other charts, without axes. */
export type PieChartCreatedEvent = Core.PieChartCreatedEvent;

/**
 * A 1.x plugin: a function that gets the chart object (and its options)
 * and registers listeners with `chart.on('draw', …)`. It runs with the
 * `compat` plugin from `chartist/compat`, whose `fromLegacyPlugin()` also
 * turns it into a v2 plugin.
 */
export type Plugin = Core.Plugin;

/**
 * The 1.x `draw` event of a line chart's point, one per value. The point is a
 * very short `line` element at `x`, `y` (CSS gives it a round cap).
 */
export type PointDrawEvent = Core.PointDrawEvent;

/**
 * The 1.x `draw` event of a pie or donut slice, one per value. `index` is
 * the slice's index and `series` its value as given in the data.
 */
export type SliceDrawEvent = Core.SliceDrawEvent;

/**
 * The 1.x `draw` event of a pie slice's label. `index` is the slice's
 * index; the label is a `text` element anchored at `x`, `y`.
 */
export type SliceLabelDrawEvent = Core.SliceLabelDrawEvent;
