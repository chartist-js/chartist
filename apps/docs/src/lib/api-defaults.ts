/**
 * Option defaults for the API reference: read
 * from the presets' defaults objects in the library's source, so the tables
 * can't drift from the code.
 */
import { barDefaults } from '../../../../packages/chartist/src/presets/barDefaults';
import { lineDefaults } from '../../../../packages/chartist/src/presets/lineDefaults';
import { pieDefaults } from '../../../../packages/chartist/src/presets/pieDefaults';

/** Option types → the defaults that apply to them. */
const DEFAULTS: Record<string, object> = {
  LineChartPresetOptions: lineDefaults,
  LineChartOptions: lineDefaults,
  BarChartPresetOptions: barDefaults,
  BarChartOptions: barDefaults,
  PieChartPresetOptions: pieDefaults,
  PieChartOptions: pieDefaults
};

/** A default as code, or undefined when there's none to show. */
function format(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value === 'function') {
    // noop and friends: "returns the value", shown by the comment.
    return undefined;
  }
  if (typeof value === 'string') {
    return `'${value}'`;
  }
  if (value === null || typeof value !== 'object') {
    return String(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map(item => format(item) ?? '…').join(', ')}]`;
  }
  const entries = Object.entries(value)
    .map(([key, item]) => [key, format(item)] as const)
    .filter(([, item]) => item !== undefined);
  return `{ ${entries.map(([key, item]) => `${key}: ${item}`).join(', ')} }`;
}

/**
 * The default of `path` (`showArea`, `axisX.offset`) in an option type's
 * defaults, or undefined. Nested objects whose members are listed on their
 * own aren't shown as a whole.
 */
export function defaultFor(
  typeName: string,
  path: string,
  nested = false
): string | undefined {
  let value: unknown = DEFAULTS[typeName];
  if (!value) {
    return undefined;
  }
  for (const key of path.split('.')) {
    if (value === null || typeof value !== 'object' || !(key in value)) {
      return undefined;
    }
    value = (value as Record<string, unknown>)[key];
  }
  if (
    nested &&
    value !== null &&
    typeof value === 'object' &&
    !Array.isArray(value)
  ) {
    return undefined;
  }
  return format(value);
}

export const hasDefaults = (typeName: string) => typeName in DEFAULTS;
