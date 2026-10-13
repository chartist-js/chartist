import { axisUnits } from '../axes/Axis';
import type { ChartRect, Label } from '../core/types';
import { axisLength, type AxisFactory, type LegacyAxisClass } from './axis';

interface LegacyAxisInstance {
  ticks: Label[];
  stretch?: boolean;
  range?: { min: number; max: number };
  projectValue(value: unknown, index?: number, series?: unknown): number;
}

/** True for 1.x axis classes and custom subclasses of the 1.x `Axis`. */
export function isLegacyAxisClass(type: unknown): type is LegacyAxisClass {
  return (
    typeof type === 'function' &&
    typeof (type as { prototype?: { projectValue?: unknown } }).prototype
      ?.projectValue === 'function'
  );
}

/**
 * Wraps a 1.x axis class as a factory: constructs it with the 1.x
 * arguments and uses its ticks, range and projection.
 */
export function legacyAxis(type: LegacyAxisClass): AxisFactory {
  return {
    kind: 'legacy',
    create({ dimension, series, area, options }) {
      const chartRect: ChartRect = {
        x1: area.x1,
        x2: area.x2,
        y1: area.y1,
        y2: area.y2,
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
        width: () => area.x2 - area.x1,
        height: () => area.y1 - area.y2
      };
      const instance = new (type as unknown as new (
        ...args: unknown[]
      ) => LegacyAxisInstance)(
        axisUnits[dimension],
        series,
        chartRect,
        options
      );
      return {
        dimension,
        // 1.x positions bars by `instanceof StepAxis`; step axes have `stretch`.
        kind: typeof instance.stretch === 'boolean' ? 'step' : 'legacy',
        stretch: instance.stretch,
        ticks: instance.ticks,
        range: instance.range,
        length: axisLength(dimension, area),
        project: (value, index, values) =>
          instance.projectValue(value, index, values)
      };
    }
  };
}
