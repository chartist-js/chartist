/**
 * Repairs a value range that's empty because high is at or below low, from
 * flat data or a misconfigured `high`/`low`: sets the bound on the other
 * side of zero to 0, or gives `0` to `1` when there are no values. Chart
 * code that overrides a bound after `getHighLow` calls it again.
 *
 * @param highLow The range to check.
 * @returns The range, or the repaired one.
 */
export function nonEmptyRange(highLow: {
  readonly high: number;
  readonly low: number;
}): { high: number; low: number } {
  const { high, low } = highLow;
  if (high > low) {
    return { high, low };
  }
  if (low === 0) {
    // Both are 0.
    return { high: 1, low };
  }
  if (low < 0) {
    // The same negative value for both.
    return { high: 0, low };
  }
  if (high > 0) {
    // The same positive value for both.
    return { high, low: 0 };
  }
  // No values: high and low are still -Number.MAX_VALUE and Number.MAX_VALUE.
  return { high: 1, low: 0 };
}
