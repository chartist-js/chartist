/** What keyboard navigation needs of a value. */
export interface Stop {
  readonly seriesIndex: number;
  readonly valueIndex?: number;
}

/** The keys the plugin handles; others pass to the page. */
export const KEYS = new Set([
  'ArrowLeft',
  'ArrowRight',
  'ArrowUp',
  'ArrowDown',
  'Home',
  'End'
]);

/** Values grouped by series, in series order, each sorted by value index. */
export function groupBySeries<T extends Stop>(stops: readonly T[]): T[][] {
  const groups = new Map<number, T[]>();
  for (const stop of stops) {
    const group = groups.get(stop.seriesIndex) ?? [];
    group.push(stop);
    groups.set(stop.seriesIndex, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, group]) =>
      group.sort((a, b) => (a.valueIndex ?? 0) - (b.valueIndex ?? 0))
    );
}

/**
 * The value a key moves to from `current`, or `undefined` at an end. Left
 * and right step within the series, or across series when every series has
 * one value (pies, distributed bars); up and down go to the same index in
 * the previous or next series that has values, the nearest one when it
 * hasn't that index; `Home` and `End` go to the series' ends.
 */
export function step<T extends Stop>(
  groups: readonly (readonly T[])[],
  current: T,
  key: string
): T | undefined {
  const single = groups.every(group => group.length === 1);
  if (single) {
    const flat = groups.map(group => group[0]);
    const index = flat.indexOf(current);
    const target =
      key === 'Home'
        ? 0
        : key === 'End'
          ? flat.length - 1
          : key === 'ArrowLeft' || key === 'ArrowUp'
            ? index - 1
            : index + 1;
    return flat[target];
  }
  const row = groups.findIndex(group => group.includes(current));
  const group = groups[row];
  const index = group.indexOf(current);
  switch (key) {
    case 'ArrowLeft':
      return group[index - 1];
    case 'ArrowRight':
      return group[index + 1];
    case 'Home':
      return group[0];
    case 'End':
      return group[group.length - 1];
    default: {
      const next = groups[row + (key === 'ArrowUp' ? -1 : 1)];
      if (!next) {
        return undefined;
      }
      const wanted = current.valueIndex ?? 0;
      return next.reduce((best, candidate) =>
        Math.abs((candidate.valueIndex ?? 0) - wanted) <
        Math.abs((best.valueIndex ?? 0) - wanted)
          ? candidate
          : best
      );
    }
  }
}
