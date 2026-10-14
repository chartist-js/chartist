/**
 * The global `Chartist` that plugin scripts of the 0.x and 1.x era read.
 * They register on `Chartist.plugins`, check the chart type with
 * `instanceof Chartist.Line`, and call helpers such as `Chartist.extend`.
 * Importing `chartist/compat` (any build: module, CommonJS or the UMD
 * script) sets this up, so such a script works when it loads after it.
 *
 * The names are added to the global only, never exported: the module
 * builds keep the 1.x and v2 names.
 */
import * as core from '../index';
import {
  BarChart,
  LineChart,
  PieChart,
  normalizeData,
  type Data
} from '../index';

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

/** The 0.x names plugin scripts use, next to the library's own. */
const LEGACY_NAMES = {
  // 0.x names of the chart classes, for `chart instanceof Chartist.Line`.
  Line: LineChart,
  Bar: BarChart,
  Pie: PieChart,
  getDataArray
};

type Root = { Chartist?: Record<string, unknown>; document?: unknown };

/**
 * Adds the core, compat and the 0.x names to the global `Chartist`, only
 * what it lacks: a global set by the UMD build or by plugin scripts keeps
 * its values, and `plugins` keeps what scripts registered. If the global
 * belongs to another copy of Chartist (say the UMD build next to these
 * modules), it is left alone with a warning: mixing two copies breaks the
 * plugins' type checks. Outside a browser it does nothing.
 */
export function installGlobal(
  compat: Record<string, unknown>,
  root: Root = globalThis as Root
): void {
  if (root.document === undefined) {
    return;
  }
  const existing = root.Chartist;
  if (existing && 'LineChart' in existing && existing.LineChart !== LineChart) {
    // A hint for developers, as the warnings for 1.x events without compat.
    // eslint-disable-next-line no-console
    console.warn(
      'Chartist: the global `Chartist` belongs to another copy of Chartist, so chartist/compat leaves it alone. Load Chartist once: as modules, or as the UMD build with compat.umd.js.'
    );
    return;
  }
  const target = existing ?? (root.Chartist = {});
  const add = (name: string, value: unknown) => {
    if (!(name in target)) {
      target[name] = value;
    }
  };
  for (const [name, value] of Object.entries(core)) {
    add(name, value);
  }
  for (const [name, value] of Object.entries(compat)) {
    add(name, value);
  }
  add('plugins', {});
  for (const [name, value] of Object.entries(LEGACY_NAMES)) {
    add(name, value);
  }
}
