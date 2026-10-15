/**
 * @chartist-js/terminal: Chartist charts in the terminal and as text-art
 * HTML. The chart functions take the data and options of Chartist's
 * presets; the renderers take any scene from `toScene()`.
 */
export { barChart, lineChart, pieChart } from './charts.ts';
export type {
  TerminalBarChartOptions,
  TerminalChartOptions,
  TerminalLineChartOptions,
  TerminalPieChartOptions
} from './charts.ts';
export { legend } from './legend.ts';
export type { LegendOptions } from './legend.ts';
export { renderToTerminal } from './ansi.ts';
export type { TerminalRenderOptions } from './ansi.ts';
export { renderToHtml } from './html.ts';
export { terminalStyles } from './styles.ts';
export { CELL_HEIGHT, CELL_WIDTH, measureCells, terminalSize } from './draw.ts';
export { detectColorMode } from './color.ts';
export type { ColorMode, ColorStream } from './color.ts';
