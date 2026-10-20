import type { ScaleAxis } from 'chartist';

/**
 * How far a line's ends move right on a step axis with `align: 'center'`:
 * half a step, so they sit where bars are centered. The line and band
 * layers of the core place their points the same way.
 */
export function centerShift(
  axisX: ScaleAxis,
  align: 'start' | 'center' | undefined
): number {
  return align === 'center' && axisX.kind === 'step' && !axisX.stretch
    ? (axisX.step ?? 0) / 2
    : 0;
}
