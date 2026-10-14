/**
 * The entry of `compat.umd.js`. Loaded as a script after `index.umd.js`, it
 * adds compat to the global `Chartist`, and the 0.x names that plugin
 * scripts of the 0.x era use: `plugins` to register on, `Line`, `Bar` and
 * `Pie` for their type checks, and `getDataArray`. The 0.x names are not
 * part of the module builds, which keep the 1.x and v2 names only.
 */
import {
  BarChart,
  LineChart,
  PieChart,
  normalizeData,
  type Data
} from '../index';

export * from './index';

/** 0.x: where plugin scripts register (`Chartist.plugins.legend = …`). */
export const plugins: Record<string, unknown> =
  // Keeps what scripts loaded earlier registered on the global.
  (
    globalThis as {
      Chartist?: { plugins?: Record<string, unknown> };
    }
  ).Chartist?.plugins ?? {};

/** 0.x name of {@link LineChart}. */
export const Line = LineChart;
/** 0.x name of {@link BarChart}. */
export const Bar = BarChart;
/** 0.x name of {@link PieChart}. */
export const Pie = PieChart;

/**
 * 0.x: the values of each series as plain numbers (`undefined` for holes),
 * normalized as the 1.x charts do; reversed when `reverse` is true. Line
 * and bar data give an array per series, pie data one array.
 */
export function getDataArray(
  data: Data,
  reverse?: boolean
): (number | undefined)[] | (number | undefined)[][] {
  return normalizeData(data as Data<never>, reverse).series as
    | (number | undefined)[]
    | (number | undefined)[][];
}
