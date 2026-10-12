/**
 * The examples manifest: one entry per example folder in this package.
 *
 * Consumers (the docs site, the playground, the visual regression tests)
 * read the example files from `<folder>/index.html` and `<folder>/src/`.
 */

export type ChartType = 'line' | 'bar' | 'pie';

/** Named viewport presets the visual regression tests render an example at. */
export type ViewportName = 'default' | 'tablet' | 'mobile' | 'mobile-landscape';

export const viewportSizes: Record<
  ViewportName,
  { width: number; height: number }
> = {
  default: { width: 1024, height: 768 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 812 },
  'mobile-landscape': { width: 812, height: 375 }
};

export interface Example {
  /** `<type>/<name>`, unique. */
  id: string;
  /** The example folder, relative to this package. Derived from `id`. */
  folder: string;
  title: string;
  type: ChartType;
  /** Shown in the docs (`true`) or only used by the tests (`false`). */
  docs: boolean;
  /**
   * Uses a 1.x event listener (`.on(...)`) or the 1.x `Svg` API, so it needs
   * the compat plugin in v2.
   */
  compat: boolean;
  /** Viewports the visual regression tests render the example at. */
  viewports: ViewportName[];
  /**
   * `fixed`: the tests give the chart container a fixed size.
   * `viewport`: the container keeps the size the example's `index.html` gives
   * it, for responsive examples tested at several viewports.
   */
  size: 'fixed' | 'viewport';
  /**
   * When the tests take the screenshot, in milliseconds after the chart was
   * created: timers up to that time fire, and SMIL animations are seeked to
   * it and paused. Animated examples use the end of their animations.
   */
  settle: { at: number };
}

type ExampleInput = Pick<Example, 'id' | 'title'> &
  Partial<Omit<Example, 'id' | 'title' | 'folder' | 'type'>>;

function example(input: ExampleInput): Example {
  return {
    folder: input.id,
    type: input.id.split('/')[0] as ChartType,
    docs: true,
    compat: false,
    viewports: ['default'],
    size: 'fixed',
    settle: { at: 0 },
    ...input
  };
}

/** A test-only example, not shown in the docs. */
function testOnly(input: ExampleInput): Example {
  return example({ docs: false, ...input });
}

export const examples: Example[] = [
  // Line charts (1.x sandboxes)
  example({ id: 'line/simple', title: 'Simple line chart' }),
  example({ id: 'line/area', title: 'Line chart with area' }),
  example({ id: 'line/axis-auto', title: 'Auto scale axis' }),
  example({
    id: 'line/axis-fixed-and-auto',
    title: 'Fixed and auto scale axis'
  }),
  example({
    id: 'line/bipolar-area',
    title: 'Bi-polar Line chart with area only'
  }),
  example({ id: 'line/data-holes', title: 'Holes in data' }),
  example({ id: 'line/data-fill-holes', title: 'Filled holes in data' }),
  example({
    id: 'line/modify-drawing',
    title: 'Using events to replace graphics',
    compat: true
  }),
  example({ id: 'line/only-integer', title: 'Only whole numbers' }),
  example({
    id: 'line/path-animation',
    title: 'SVG Path animation',
    compat: true,
    settle: { at: 6000 }
  }),
  example({
    id: 'line/scatter-random',
    title: 'Line scatter diagram with responsive settings'
  }),
  example({ id: 'line/series-override', title: 'Series Overrides' }),
  example({ id: 'line/simple-responsive', title: 'Simple responsive options' }),
  example({
    id: 'line/simple-smoothing',
    title: 'Line Interpolation / Smoothing'
  }),
  example({
    id: 'line/simple-svg-animation',
    title: 'Simple SMIL Animations',
    compat: true,
    settle: { at: 4300 }
  }),
  example({
    id: 'line/svg-animation',
    title: 'Advanced SMIL Animations',
    compat: true,
    settle: { at: 7000 }
  }),
  example({ id: 'line/timeseries', title: 'Timeseries' }),

  // Bar charts (1.x sandboxes)
  example({ id: 'bar/bi-polar-interpolated', title: 'Bi-polar bar chart' }),
  example({ id: 'bar/distributed-series', title: 'Distributed series' }),
  example({
    id: 'bar/extreme-responsive',
    title: 'Extreme responsive configuration'
  }),
  example({ id: 'bar/horizontal', title: 'Horizontal bar chart' }),
  example({ id: 'bar/label-position', title: 'Label placement' }),
  example({ id: 'bar/multiline', title: 'Multi-line labels' }),
  example({ id: 'bar/overlapping-bars', title: 'Overlapping bars on mobile' }),
  example({ id: 'bar/stacked', title: 'Stacked bar chart', compat: true }),
  example({
    id: 'bar/stacked-accumulate-relative',
    title: 'Stacked bar chart with accumulate-relative stack mode'
  }),
  example({
    id: 'bar/with-circle-modify-drawing',
    title: 'Add peak circles using the draw events',
    compat: true
  }),

  // Pie charts (1.x sandboxes)
  example({ id: 'pie/simple', title: 'Simple pie chart' }),
  example({ id: 'pie/custom-labels', title: 'Pie chart with custom labels' }),
  example({ id: 'pie/donut-chart', title: 'Donut chart' }),
  example({
    id: 'pie/donut-animation',
    title: 'Animating a Donut with Svg.animate',
    compat: true,
    settle: { at: 7000 }
  }),
  example({ id: 'pie/simple-gauge', title: 'Gauge chart' }),

  // Test-only cases ported from the 1.x Storybook stories (see README.md)
  testOnly({ id: 'line/auto-scale', title: 'Line chart with auto scale axes' }),
  testOnly({ id: 'line/labels', title: 'Line chart with labels' }),
  testOnly({
    id: 'line/multi-series',
    title: 'Line chart with series of different lengths'
  }),
  testOnly({
    id: 'line/no-interpolation-with-holes',
    title: 'No interpolation with holes'
  }),
  testOnly({
    id: 'line/cardinal-interpolation-with-holes',
    title: 'Cardinal interpolation with holes'
  }),
  testOnly({
    id: 'line/monotone-cubic-interpolation-with-holes',
    title: 'Monotone cubic interpolation with holes'
  }),
  testOnly({
    id: 'line/simple-interpolation-with-holes',
    title: 'Simple interpolation with holes'
  }),
  testOnly({
    id: 'line/step-interpolation-with-holes',
    title: 'Step interpolation with holes'
  }),
  testOnly({
    id: 'line/step-no-postpone-interpolation-with-holes',
    title: 'Step interpolation without postpone, with holes'
  }),
  testOnly({ id: 'line/reverse-data', title: 'Line chart with reversed data' }),
  testOnly({ id: 'line/full-width', title: 'Full width line chart' }),
  testOnly({ id: 'line/scatter', title: 'Line scatter diagram' }),
  testOnly({ id: 'line/view-box', title: 'Line chart with a view box' }),

  testOnly({ id: 'bar/auto-scale', title: 'Bar chart with auto scale axes' }),
  testOnly({ id: 'bar/labels', title: 'Bar chart with labels' }),
  testOnly({
    id: 'bar/multi-series',
    title: 'Bar chart with series of different lengths'
  }),
  testOnly({ id: 'bar/reverse-data', title: 'Bar chart with reversed data' }),
  testOnly({
    id: 'bar/adaptive',
    title: 'Adaptive bar chart',
    viewports: ['default', 'tablet', 'mobile', 'mobile-landscape'],
    size: 'viewport'
  }),
  testOnly({
    id: 'bar/overlapping-bars-on-mobile',
    title: 'Overlapping bars on mobile (story)',
    viewports: ['default', 'mobile'],
    size: 'viewport'
  }),
  testOnly({ id: 'bar/view-box', title: 'Bar chart with a view box' }),

  testOnly({ id: 'pie/fixed-size', title: 'Pie chart with a fixed size' }),
  testOnly({ id: 'pie/labels', title: 'Pie chart with labels' }),
  testOnly({ id: 'pie/overlapping-labels', title: 'Overlapping pie labels' }),
  testOnly({
    id: 'pie/label-interpolation',
    title: 'Pie chart with percentage labels'
  }),
  testOnly({ id: 'pie/start-angle', title: 'Pie chart with a start angle' }),
  testOnly({ id: 'pie/small-slices', title: 'Pie chart with small slices' }),
  testOnly({
    id: 'pie/ignore-empty-values',
    title: 'Pie chart ignoring empty values'
  }),
  testOnly({ id: 'pie/donut', title: 'Simple donut chart' }),
  // Charts with a fixed size larger than the test container keep their size.
  testOnly({ id: 'pie/gauge-donut', title: 'Gauge donut', size: 'viewport' }),
  testOnly({
    id: 'pie/relative-donut-width',
    title: 'Donut with a relative width',
    size: 'viewport'
  }),
  testOnly({ id: 'pie/view-box', title: 'Pie chart with a view box' })
];
