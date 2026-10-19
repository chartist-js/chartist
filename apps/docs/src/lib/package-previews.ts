/**
 * What each package draws, as HTML rendered while the site is built: the
 * package index and the landing page show it without loading a script.
 * Every package in `src/data/packages.ts` needs an entry here.
 */
import { fixedScaleAxis, lineChartConfig, toScene } from 'chartist';
import { renderToString } from 'chartist/server';
import { axisTitle } from '@chartist-js/essentials';
import { lineChart } from '@chartist-js/terminal';

/** A package's preview: its markup, and the frame it's shown in. */
export interface PackagePreview {
  readonly html: string;
  /** Shown in a terminal window with this title, e.g. `ct-cli`. */
  readonly terminal?: string;
  /** What the preview shows, for assistive technology. */
  readonly label: string;
}

/**
 * The chart the packages section of the landing page draws twice: as SVG
 * with `lineChart()` from `chartist`, and as text art with the terminal
 * package. The data and options of the terminal overview's example.
 */
export const TEXT_ART_CHART = {
  data: {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    series: [
      [12, 9, 7, 8, 5],
      [2, 1, 3.5, 7, 3]
    ]
  },
  options: { low: 0, showArea: true, lineSmooth: true }
};

/**
 * The Y axis both drawings share. Fixed ticks: on its own, each renderer
 * would pick steps that suit its size (2.5 in SVG, 5 in text art).
 */
export const TEXT_ART_Y_AXIS = { ticks: [0, 5, 10, 15], low: 0, high: 15 };

/**
 * The text art of {@link TEXT_ART_CHART}; the default size is narrow
 * enough for a phone.
 */
export const textArt = (columns = 34, rows = 14): string =>
  lineChart(TEXT_ART_CHART.data, {
    ...TEXT_ART_CHART.options,
    axisY: { ...TEXT_ART_Y_AXIS, type: fixedScaleAxis() },
    columns,
    rows,
    format: 'html'
  });

/**
 * A line chart with both axes named, as SVG: the overview's first example,
 * scaled to its box with a `viewBox`, styled by the site's Chartist and
 * essentials stylesheets.
 */
export function axisTitlesPreview(): string {
  const size = { width: 480, height: 280 };
  const config = lineChartConfig(
    {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      series: [[1200, 1450, 1380, 1620, 1500]]
    },
    {
      low: 0,
      layers: {
        above: [
          axisTitle({ axis: 'x', text: 'Day' }),
          axisTitle({ axis: 'y', text: 'Visits' })
        ]
      }
    }
  );
  // Scaled by its viewBox to the card's width; the card's wrapper names it
  // for assistive technology, so the svg itself is hidden from it.
  const scene = toScene({ ...config, viewBox: size, width: '100%' }, size);
  return renderToString(scene.attr({ height: null, 'aria-hidden': 'true' }));
}

export const PREVIEWS: Readonly<Record<string, () => PackagePreview>> = {
  essentials: () => ({
    html: axisTitlesPreview(),
    label:
      'A line chart of visits from Monday to Friday, with the titles Day below the X axis and Visits beside the Y axis'
  }),
  terminal: () => ({
    html: textArt(),
    terminal: 'ct-cli',
    label:
      'A smoothed line chart with areas from Monday to Friday, drawn in braille dots and box-drawing characters'
  })
};

/** A package's preview; throws for a package without one. */
export function packagePreview(slug: string): PackagePreview {
  const preview = PREVIEWS[slug];
  if (!preview) {
    throw new Error(
      `No preview for package "${slug}" (src/lib/package-previews.ts)`
    );
  }
  return preview();
}
