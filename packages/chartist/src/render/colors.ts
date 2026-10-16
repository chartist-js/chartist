/**
 * The default series colors, `a` to `o`, as hex: the colors of
 * `chartist/styles.css` (`$ct-series-colors` in the Sass settings).
 * Renderers without CSS use them to color series the way the styles do.
 * The styles color the first fifteen series only.
 *
 * @example
 * ```ts
 * import { seriesColors } from 'chartist';
 *
 * // The color of series `c`, the third.
 * export const third = seriesColors[2];
 * ```
 */
export const seriesColors: readonly string[] = [
  '#d70206',
  '#f05b4f',
  '#f4c63d',
  '#d17905',
  '#453d3f',
  '#59922b',
  '#0544d3',
  '#6b0392',
  '#e6805e',
  '#dda458',
  '#eacf7d',
  '#86797d',
  '#b2c326',
  '#6188e2',
  '#a748ca'
];
