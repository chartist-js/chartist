/**
 * The examples manifest: one entry per example folder in this package.
 *
 * Consumers (the docs site, the playground, the visual regression tests)
 * read the example files from `<folder>/index.html` and `<folder>/src/`.
 */

export type ChartType =
  | 'line'
  | 'bar'
  | 'pie'
  | 'composed'
  | 'styling'
  | 'live'
  | 'essentials';

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
  /** One sentence for the docs gallery card and the example's page. */
  description?: string;
  type: ChartType;
  /** Shown in the docs (`true`) or only used by the tests (`false`). */
  docs: boolean;
  /**
   * Has a classic entry, `src/main.classic.ts`: the 1.x code that draws the
   * same chart with the chart classes. `src/main.ts` is then the functional
   * version. Both are screenshot against the same baseline image, and the
   * 1.5.0 visual run renders the classic entry.
   */
  classic: boolean;
  /**
   * The 1.x code (the classic entry, or `main.ts` before it's converted)
   * uses a 1.x event listener (`.on(...)`) or the 1.x `Svg` API, so it needs
   * the compat plugin in v2.
   */
  compat: boolean;
  /**
   * Has no 1.x code at all (only v2 API, no classic entry), so
   * chartist@1.5.0 can't render it; the 1.5.0 visual run skips it.
   */
  v2: boolean;
  /**
   * Why the functional entry has its own baseline image instead of sharing
   * the classic one. Only for deliberate v2 differences; leave unset when
   * both entries draw the same pixels.
   */
  ownBaseline?: string;
  /**
   * Why the example's baseline image (shared by both entries) is recorded
   * from the local build instead of 1.5.0: v2 deliberately changes how 1.x
   * draws it, for both APIs. The 1.5.0 visual run skips the example, so
   * re-recording the baseline from 1.5.0 can't undo the change.
   */
  localBaseline?: string;
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
    classic: false,
    compat: false,
    v2: false,
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
  example({
    id: 'line/simple',
    title: 'Simple line chart',
    description: 'Three series, Monday to Friday, stretched to the full width.',
    classic: true
  }),
  testOnly({
    id: 'line/svg-labels',
    title: 'Simple line chart with SVG text labels',
    v2: true
  }),
  example({
    id: 'line/area',
    title: 'Line chart with area',
    description:
      'One series drawn as a line with the area below it filled down to zero.',
    classic: true
  }),
  example({
    id: 'line/axis-auto',
    title: 'Auto scale axis',
    description:
      'A halving series on an auto scale x axis that only uses whole numbers.',
    classic: true
  }),
  example({
    id: 'line/axis-fixed-and-auto',
    title: 'Fixed and auto scale axis',
    description:
      'A step line on an auto scale x axis and a fixed y axis with hand-picked ticks.',
    classic: true
  }),
  example({
    id: 'line/bipolar-area',
    title: 'Bi-polar Line chart with area only',
    description:
      'Four series swinging above and below zero, drawn as filled areas only.',
    classic: true
  }),
  example({
    id: 'line/data-holes',
    title: 'Holes in data',
    description:
      'Series with missing values, where each line breaks at every hole.',
    classic: true
  }),
  example({
    id: 'line/data-fill-holes',
    title: 'Filled holes in data',
    description:
      'Series with missing values, bridged by a cardinal spline that fills the holes.',
    classic: true
  }),
  example({
    id: 'line/modify-drawing',
    title: 'Using events to replace graphics',
    description:
      'A plugin swaps every point for a triangle while the chart is composed.',
    classic: true,
    compat: true
  }),
  example({
    id: 'line/only-integer',
    title: 'Only whole numbers',
    description:
      'Four series between -3 and 3 on a y axis that only labels whole numbers.',
    classic: true
  }),
  example({
    id: 'line/path-animation',
    title: 'SVG Path animation',
    description:
      'Lines and areas of three series grow from the bottom, one series after the other.',
    classic: true,
    compat: true,
    settle: { at: 6100 }
  }),
  example({
    id: 'line/scatter-random',
    title: 'Line scatter diagram with responsive settings',
    description:
      'Four series of random points over 52 weeks, with more week labels on wider screens.',
    classic: true
  }),
  example({
    id: 'line/series-override',
    title: 'Series Overrides',
    description:
      'Three named series, each with its own interpolation, area or points.',
    classic: true
  }),
  example({
    id: 'line/simple-responsive',
    title: 'Simple responsive options',
    description:
      'A growing series whose labels shorten and whose points or line hide as the screen narrows.',
    classic: true
  }),
  example({
    id: 'line/simple-smoothing',
    title: 'Line Interpolation / Smoothing',
    description:
      'Two series with large jumps, drawn with simple smoothing instead of a cardinal spline.',
    classic: true
  }),
  example({
    id: 'line/simple-svg-animation',
    title: 'Simple SMIL Animations',
    description:
      'Points of two series fade and slide in one after the other, replayed every eight seconds.',
    classic: true,
    compat: true,
    settle: { at: 4400 }
  }),
  example({
    id: 'line/svg-animation',
    title: 'Advanced SMIL Animations',
    description:
      'Grid lines, labels, points and lines of four series fly in one after the other.',
    classic: true,
    compat: true,
    settle: { at: 8600 }
  }),
  example({
    id: 'line/timeseries',
    title: 'Timeseries',
    description:
      'Two series of dated values on a fixed scale X axis with six month and day labels.',
    classic: true,
    localBaseline:
      'With divisor, fixedScaleAxis puts a tick at high (#1022); 1.5.0 stops one tick short.'
  }),

  // Bar charts (1.x sandboxes)
  example({
    id: 'bar/bi-polar-interpolated',
    title: 'Bi-polar bar chart',
    description:
      'Ten weeks of positive and negative values around zero, with every other label shown.',
    classic: true
  }),
  example({
    id: 'bar/distributed-series',
    title: 'Distributed series',
    description:
      'One series of clothing sizes, each value drawn as its own bar and color.',
    classic: true
  }),
  example({
    id: 'bar/extreme-responsive',
    title: 'Extreme responsive configuration',
    description:
      'Five series per quarter that switch between stacked, horizontal and grouped bars as the screen grows.',
    classic: true,
    // One viewport per breakpoint: below 400px, 400 to 800px, 800 to
    // 1000px and from 1000px.
    viewports: ['default', 'tablet', 'mobile', 'mobile-landscape']
  }),
  example({
    id: 'bar/horizontal',
    title: 'Horizontal bar chart',
    description: 'Two series across the days of the week, drawn sideways.',
    classic: true
  }),
  example({
    id: 'bar/label-position',
    title: 'Label placement',
    description:
      'Two weekly series with the x-axis labels on top and the y-axis labels on the right.',
    classic: true
  }),
  example({
    id: 'bar/multiline',
    title: 'Multi-line labels',
    description:
      'Quarterly amounts in CHF with long labels that wrap onto several lines.',
    classic: true
  }),
  testOnly({
    id: 'bar/svg-labels-multiline',
    title: 'Multi-line SVG text labels',
    v2: true
  }),
  testOnly({
    id: 'bar/svg-labels-horizontal',
    title: 'Horizontal bar chart with SVG text labels',
    v2: true
  }),
  example({
    id: 'bar/overlapping-bars',
    title: 'Overlapping bars on mobile',
    description:
      'Two series over twelve months whose bars move closer together and labels shorten on small screens.',
    classic: true
  }),
  example({
    id: 'bar/stacked',
    title: 'Stacked bar chart',
    description:
      'Three series stacked per quarter, with a plugin that widens every bar.',
    classic: true,
    compat: true
  }),
  example({
    id: 'bar/stacked-accumulate-relative',
    title: 'Stacked bar chart with accumulate-relative stack mode',
    description:
      'Positive and negative values stacked separately, up and down from zero.',
    classic: true
  }),
  example({
    id: 'bar/with-circle-modify-drawing',
    title: 'Add peak circles using the draw events',
    description:
      'A plugin adds a circle at the peak of every bar, sized by its value.',
    classic: true,
    compat: true
  }),

  // Pie charts (1.x sandboxes)
  example({
    id: 'pie/simple',
    title: 'Simple pie chart',
    description: 'Three slices, each labelled with its share of the total.',
    classic: true
  }),
  example({
    id: 'pie/custom-labels',
    title: 'Pie chart with custom labels',
    description:
      'Fruit slices labelled with an initial on small screens and the full name, pushed outside, on larger ones.',
    classic: true
  }),
  example({
    id: 'pie/donut-chart',
    title: 'Donut chart',
    description: 'Four labelled slices on a thick ring, starting at the left.',
    classic: true
  }),
  example({
    id: 'pie/donut-animation',
    title: 'Animating a Donut with Svg.animate',
    description:
      'A plugin draws the donut slice by slice with SMIL, each one starting where the previous one ends.',
    classic: true,
    compat: true,
    settle: { at: 7100 }
  }),
  example({
    id: 'pie/simple-gauge',
    title: 'Gauge chart',
    description:
      'Four values on a half ring: a total of twice their sum leaves the lower half empty.',
    classic: true
  }),

  // Test-only cases ported from the 1.x Storybook stories (see README.md)
  testOnly({
    id: 'line/auto-scale',
    title: 'Line chart with auto scale axes',
    description:
      'Two x/y points on whole-number auto scale axes in both directions.',
    classic: true
  }),
  testOnly({
    id: 'line/labels',
    title: 'Line chart with labels',
    description: 'One series over five weekday labels.',
    classic: true
  }),
  testOnly({
    id: 'line/multi-series',
    title: 'Line chart with series of different lengths',
    description: 'Two series of different lengths over eight weekday labels.',
    classic: true
  }),
  testOnly({
    id: 'line/no-interpolation-with-holes',
    title: 'No interpolation with holes',
    description:
      'Straight line segments that break wherever the series has a missing value.',
    classic: true
  }),
  testOnly({
    id: 'line/cardinal-interpolation-with-holes',
    title: 'Cardinal interpolation with holes',
    description:
      'A cardinal spline that breaks wherever the series has a missing value.',
    classic: true
  }),
  testOnly({
    id: 'line/monotone-cubic-interpolation-with-holes',
    title: 'Monotone cubic interpolation with holes',
    description:
      'A monotone cubic spline that breaks wherever the series has a missing value.',
    classic: true
  }),
  testOnly({
    id: 'line/simple-interpolation-with-holes',
    title: 'Simple interpolation with holes',
    description:
      'A series with holes, drawn with simple smoothing that breaks at each hole.',
    classic: true
  }),
  testOnly({
    id: 'line/step-interpolation-with-holes',
    title: 'Step interpolation with holes',
    description: 'A series with holes, drawn as steps that break at each hole.',
    classic: true
  }),
  testOnly({
    id: 'line/step-no-postpone-interpolation-with-holes',
    title: 'Step interpolation without postpone, with holes',
    description:
      'A series with holes, drawn as steps that change before each point instead of after.',
    classic: true
  }),
  testOnly({
    id: 'line/reverse-data',
    title: 'Line chart with reversed data',
    description: 'A two-point series of x and y values, drawn in reverse.',
    classic: true
  }),
  testOnly({
    id: 'line/full-width',
    title: 'Full width line chart',
    description: 'Two x/y points stretched across the full width of the chart.',
    classic: true
  }),
  testOnly({
    id: 'line/scatter',
    title: 'Line scatter diagram',
    description:
      'Four series of whole-number points over 52 weeks, without lines.',
    classic: true
  }),
  testOnly({
    id: 'line/view-box',
    title: 'Line chart with a view box',
    description:
      'Three series in a fixed view box that scales with the container.',
    classic: true
  }),

  testOnly({
    id: 'bar/auto-scale',
    title: 'Bar chart with auto scale axes',
    description: 'Two x/y points on auto scale axes with whole-number ticks.',
    classic: true
  }),
  testOnly({
    id: 'bar/labels',
    title: 'Bar chart with labels',
    description: 'One series of five values, labeled Sunday to Thursday.',
    classic: true
  }),
  testOnly({
    id: 'bar/multi-series',
    title: 'Bar chart with series of different lengths',
    description: 'Three series of four, three and two values, without labels.',
    classic: true
  }),
  testOnly({
    id: 'bar/reverse-data',
    title: 'Bar chart with reversed data',
    description: 'Three series of different lengths, drawn in reverse order.',
    classic: true
  }),
  testOnly({
    id: 'bar/adaptive',
    title: 'Adaptive bar chart',
    description:
      'Five series per quarter that switch between stacked, horizontal and grouped bars as the screen grows.',
    classic: true,
    viewports: ['default', 'tablet', 'mobile', 'mobile-landscape'],
    size: 'viewport'
  }),
  testOnly({
    id: 'bar/overlapping-bars-on-mobile',
    title: 'Overlapping bars on mobile (story)',
    description:
      'Two series over twelve months whose bars move closer together and labels shorten on small screens.',
    classic: true,
    viewports: ['default', 'mobile'],
    size: 'viewport'
  }),
  testOnly({
    id: 'bar/view-box',
    title: 'Bar chart with a view box',
    description:
      'Two x/y points in a fixed view box that halves on small screens.',
    classic: true,
    // Below and above the 575px breakpoint.
    viewports: ['default', 'mobile']
  }),

  testOnly({
    id: 'pie/fixed-size',
    title: 'Pie chart with a fixed size',
    classic: true
  }),
  testOnly({
    id: 'pie/labels',
    title: 'Pie chart with labels',
    classic: true
  }),
  testOnly({
    id: 'pie/overlapping-labels',
    title: 'Overlapping pie labels',
    classic: true
  }),
  testOnly({
    id: 'pie/label-interpolation',
    title: 'Pie chart with percentage labels',
    classic: true
  }),
  testOnly({
    id: 'pie/start-angle',
    title: 'Pie chart with a start angle',
    classic: true
  }),
  testOnly({
    id: 'pie/small-slices',
    title: 'Pie chart with small slices',
    classic: true
  }),
  testOnly({
    id: 'pie/ignore-empty-values',
    title: 'Pie chart ignoring empty values',
    classic: true
  }),
  testOnly({
    id: 'pie/donut',
    title: 'Simple donut chart',
    classic: true
  }),
  // Charts with a fixed size larger than the test container keep their size.
  testOnly({
    id: 'pie/gauge-donut',
    title: 'Gauge donut',
    classic: true,
    size: 'viewport'
  }),
  testOnly({
    id: 'pie/relative-donut-width',
    title: 'Donut with a relative width',
    classic: true,
    size: 'viewport'
  }),
  testOnly({
    id: 'pie/view-box',
    title: 'Pie chart with a view box',
    classic: true
  }),

  // Composed charts (v2)
  example({
    id: 'composed/bar-and-line',
    title: 'Bars and a line with two Y axes',
    description:
      'Quarterly revenue as bars on the left axis and the margin as a line on the right one.',
    v2: true
  }),
  example({
    id: 'composed/container-queries',
    title: 'Container queries (experimental)',
    description:
      'One config in a narrow and a wide container: the narrow one drops the margin line, its axis and the grid.',
    v2: true,
    // The page sizes its two containers itself.
    size: 'viewport'
  }),
  example({
    id: 'composed/svg-labels',
    title: 'SVG text labels',
    description:
      'Bars and a line with SVG text labels, which also work where foreignObject does not.',
    v2: true
  }),
  example({
    id: 'composed/target-line',
    title: 'Target lines on a bar chart',
    description:
      'Monthly sales against a goal and a minimum, added to the bar chart preset as extra layers.',
    v2: true
  }),
  example({
    id: 'composed/band-chart',
    title: 'Band chart',
    description:
      'The range of six stores as a band, with their average and one store drawn on top.',
    v2: true
  }),
  example({
    id: 'composed/grouped-stacks',
    title: 'Grouped stacked bars',
    description:
      'New and returning customers per quarter, one stack per year, drawn by two bar layers side by side.',
    v2: true
  }),
  example({
    id: 'composed/trend-line',
    title: 'Bars with a trend line',
    description:
      'Monthly sign-ups as bars, with the least-squares trend through them added to the bar chart preset.',
    v2: true
  }),
  example({
    id: 'composed/scatter-regression',
    title: 'Scatter plot with a regression line',
    description:
      'Ice cream sales against the temperature as points, with the least-squares line through them.',
    v2: true
  }),
  example({
    id: 'composed/two-y-axes',
    title: 'Two Y axes with different units',
    description:
      'Temperature as a line and rainfall as an area, each on its own Y axis.',
    v2: true
  }),

  // Styling (v2)
  example({
    id: 'styling/custom-properties',
    title: 'Styling with custom properties',
    description:
      'The same area chart twice, the second one restyled only by setting --ct-* custom properties.',
    v2: true,
    size: 'viewport'
  }),
  example({
    id: 'styling/accessible-theme',
    title: 'Accessible theme, light and dark',
    description:
      'Four bar series in the color-blind-safe theme, on a light and on a dark background.',
    v2: true,
    size: 'viewport'
  }),
  // Live data: charts that update while they run, with seeded data and a
  // settle time after their last animation (the seismograph never rests).
  example({
    id: 'live/sensor',
    title: 'Sensor with a sliding window',
    description:
      'A new reading every second, and a line under the chart that says which elements each update kept, added and removed.',
    v2: true,
    settle: { at: 2500 }
  }),
  example({
    id: 'live/dashboard',
    title: 'Dashboard with animated bars',
    description:
      'Two series by region get new numbers every two seconds, and the bars overshoot a little on their way.',
    v2: true,
    settle: { at: 3000 }
  }),
  example({
    id: 'live/network-speed',
    title: 'Network speed',
    description:
      'Four samples a second as touching bars, with their running average as a line on top.',
    v2: true,
    settle: { at: 2200 }
  }),
  example({
    id: 'live/seismograph',
    title: 'Seismograph',
    description:
      'A thin trace that scrolls every 80 ms, quiet until a quake comes through.',
    v2: true,
    settle: { at: 2000 }
  }),
  example({
    id: 'live/votes',
    title: 'Votes by district',
    description:
      'The results of each district as it reports: the slices and their labels turn to the new shares.',
    v2: true,
    settle: { at: 1900 }
  }),
  example({
    id: 'live/gauge',
    title: 'Live gauge',
    description:
      'A half ring that follows the CPU load, updated every 1.2 seconds.',
    v2: true,
    settle: { at: 1600 }
  }),
  example({
    id: 'live/grouped-stacked',
    title: 'Grouped and stacked',
    description:
      'New numbers and a switch between grouped and stacked bars in one update, every bar moving to its new place.',
    v2: true,
    settle: { at: 3200 }
  }),
  // Essentials: the layers and axes of @chartist-js/essentials.
  example({
    id: 'essentials/axis-titles',
    title: 'Axis titles',
    description:
      'A line chart of visits per day with a title for each axis, each in room of its own.',
    v2: true
  }),
  example({
    id: 'essentials/axis-titles-composed',
    title: 'Axis titles on two Y axes',
    description:
      'Revenue in EUR and ad spend in USD on their own Y axes, each named, one title aligned to the end and one turned to face the chart.',
    v2: true
  })
];
