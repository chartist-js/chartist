/**
 * The API reference's pages: which exports
 * each page documents, by source file, with overrides by name.
 */

export interface ApiPage {
  slug: string;
  title: string;
  /** One sentence, for the page's lead and the overview. */
  description: string;
  /** The 1.x section: a 1.x badge, classes without members. */
  legacy?: 'classes';
  /** Signature and summary only, for low-level helpers. */
  compact?: boolean;
  /** Entries to show first, in this order; the rest follow by kind. */
  first?: string[];
}

export const API_PAGES: ApiPage[] = [
  {
    slug: 'charts',
    title: 'Charts',
    description:
      'lineChart, barChart and pieChart: a chart from data and options, with the 1.x options and output.',
    first: [
      'lineChart',
      'barChart',
      'pieChart',
      'LineChartData',
      'LineChartPresetOptions',
      'BarChartData',
      'BarChartPresetOptions',
      'PieChartData',
      'PieChartPresetOptions'
    ]
  },
  {
    slug: 'chart',
    title: 'chart()',
    description:
      'The composable chart: data, axes and layers in one config, and the handle it returns.'
  },
  {
    slug: 'layers',
    title: 'Layers',
    description:
      'What chart() draws: lines, bars, pies, grids and labels, each a layer over the same data.'
  },
  {
    slug: 'scales',
    title: 'Scales and axes',
    description:
      'Axes that turn values into positions: step, auto-scaled and fixed, placed on any side.'
  },
  {
    slug: 'scene',
    title: 'Scene',
    description:
      'The scene a chart composes before rendering: nodes, their roles and data, and how to find and change them.'
  },
  {
    slug: 'events-and-plugins',
    title: 'Events and plugins',
    description:
      'The pipeline phases, their events and payloads, custom events, and the plugin shape.'
  },
  {
    slug: 'rendering',
    title: 'Rendering',
    description:
      'From scene to output: renderers, text measuring, and rendering on the server.'
  },
  {
    slug: 'responsive',
    title: 'Responsive',
    description:
      'Options that change with media queries or with the size of the chart’s container.'
  },
  {
    slug: 'data',
    title: 'Data',
    description:
      'The shapes of chart data: series, values, labels and meta, as given and as normalized.'
  },
  {
    slug: 'svg',
    title: 'SVG and animation',
    description:
      'The small SVG toolkit behind the charts: elements, paths, SMIL animations, easings and line interpolation.'
  },
  {
    slug: 'compat',
    title: 'chartist/compat',
    description:
      'The 1.x events (data, draw, created, …) and 1.x plugins on the functional API.'
  },
  {
    slug: 'classes',
    title: '1.x classes',
    description:
      'LineChart, BarChart and PieChart as in 1.x, with their options, axis classes, events and drawing helpers. Deprecated, and removed from chartist in 3.0: new code uses the chart functions.',
    legacy: 'classes',
    first: ['LineChart', 'BarChart', 'PieChart', 'BaseChart']
  },
  {
    slug: 'helpers',
    title: 'Helpers',
    description:
      'The data, math and utility functions the charts are built from, for plugins and custom layers.',
    compact: true
  }
];

/** Exports placed by name, ahead of the file rules. */
const BY_NAME: Record<string, string> = {
  // Plugins and events live with the pipeline's events.
  ChartEvents: 'events-and-plugins',
  CustomEventName: 'events-and-plugins',
  ChartPlugin: 'events-and-plugins',
  PluginWithOptions: 'events-and-plugins',
  PluginEntry: 'events-and-plugins',
  withOptions: 'events-and-plugins',
  // What layers implement and receive.
  Layer: 'layers',
  LayerContext: 'layers',
  Coordinates: 'layers',
  ExtentContext: 'layers',
  // The presets' data types.
  LineChartData: 'charts',
  BarChartData: 'charts',
  PieChartData: 'charts',
  // The 1.x events and the 1.x plugin shape, which compat brings back and
  // exports; chartist's deprecated copies go to the 1.x classes page.
  Plugin: 'compat',
  CreatedEvent: 'compat',
  DrawEvent: 'compat',
  DataEvent: 'compat',
  OptionsChangedEvent: 'compat',
  GridDrawEvent: 'compat',
  GridBackgroundDrawEvent: 'compat',
  LabelDrawEvent: 'compat',
  AxesDrawEvent: 'compat',
  LineChartCreatedEvent: 'compat',
  PointDrawEvent: 'compat',
  LineDrawEvent: 'compat',
  AreaDrawEvent: 'compat',
  BarChartCreatedEvent: 'compat',
  BarDrawEvent: 'compat',
  PieChartCreatedEvent: 'compat',
  SliceDrawEvent: 'compat',
  SliceLabelDrawEvent: 'compat',
  // 1.x only: the classes' drawing, responsive options and events, and
  // the axis classes (v2 accepts them in axisX.type, as adapters).
  createSvg: 'classes',
  createGrid: 'classes',
  createGridBackground: 'classes',
  createLabel: 'classes',
  optionsProvider: 'classes',
  OptionsProvider: 'classes',
  EventEmitter: 'classes',
  EventListener: 'classes',
  AllEventsListener: 'classes',
  Axis: 'classes',
  StepAxis: 'classes',
  AutoScaleAxis: 'classes',
  FixedScaleAxis: 'classes',
  AxisType: 'classes',
  // The 1.x options all charts share.
  Options: 'classes',
  AxisOptions: 'classes',
  OptionsWithDefaults: 'classes',
  ResponsiveOptions: 'classes',
  ChartPadding: 'classes',
  // Data shapes in core/types.ts.
  Meta: 'data',
  Multi: 'data',
  NormalizedMulti: 'data',
  Label: 'data',
  AllSeriesTypes: 'data',
  Data: 'data',
  Series: 'data',
  SeriesObject: 'data',
  SeriesValue: 'data',
  SeriesPrimitiveValue: 'data',
  SeriesObjectValue: 'data',
  FlatSeries: 'data',
  FlatSeriesValue: 'data',
  FlatSeriesPrimitiveValue: 'data',
  FlatSeriesObjectValue: 'data',
  AllNormalizedSeriesTypes: 'data',
  NormalizedData: 'data',
  NormalizedSeries: 'data',
  NormalizedSeriesValue: 'data',
  NormalizedSeriesPrimitiveValue: 'data',
  NormalizedFlatSeries: 'data'
};

/** Source path prefixes (under packages/chartist/src) → page, first match. */
const BY_FILE: Array<[string, string]> = [
  ['compat/', 'compat'],
  ['presets/', 'charts'],
  ['chart/toScene', 'rendering'],
  ['chart/', 'chart'],
  ['layers/', 'layers'],
  ['scales/', 'scales'],
  ['scene/', 'scene'],
  ['pipeline/', 'events-and-plugins'],
  ['render/', 'rendering'],
  ['responsive/', 'responsive'],
  ['svg/', 'svg'],
  ['interpolation/', 'svg'],
  ['charts/', 'classes'],
  ['axes/', 'helpers'],
  ['event/', 'classes'],
  ['core/', 'helpers'],
  ['utils/', 'helpers']
];

/** The page slug of an export, from its name and source file. */
export function pageFor(name: string, file: string): string | undefined {
  return (
    BY_NAME[name] ?? BY_FILE.find(([prefix]) => file.startsWith(prefix))?.[1]
  );
}
