/**
 * The hero board chart's markup, rendered when the site is built, so the
 * chart is in the page's HTML and the browser takes it over
 * (scripts/board-chart.ts).
 */
import { lineChartConfig, renderForHydration } from 'chartist';
import { BOARD_DATA, BOARD_OPTIONS } from '../scripts/board-chart';

/**
 * The board's size when the hero's mascot is at its widest, as on
 * desktops: the chart there is laid out once. Narrower screens scale this
 * layout until the chart runs, then lay it out again.
 */
export const BOARD_SERVER_SIZE = { width: 255, height: 176 };

/** The board chart's hydration markup. */
export function boardMarkup(): string {
  return renderForHydration(
    lineChartConfig(BOARD_DATA, BOARD_OPTIONS),
    BOARD_SERVER_SIZE
  );
}
