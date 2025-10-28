import type {
  Label,
  ChartRect,
  OptionsWithDefaults,
  NormalizedSeriesPrimitiveValue,
  NormalizedSeries
} from '../core';
import type { Svg } from '../svg';
import type { EventEmitter } from '../event';

export abstract class Axis {
  public readonly range:
    | {
        min: number;
        max: number;
      }
    | undefined;
  readonly axisLength: number;
  protected readonly gridOffset: number;

  constructor(
    protected readonly chartRect: ChartRect,
    protected readonly ticks: Label[],
    axisLength: number,
    gridOffset: number
  ) {
    this.axisLength = axisLength;
    this.gridOffset = gridOffset;
  }

  abstract projectValue(
    value: NormalizedSeriesPrimitiveValue | Label,
    index?: number,
    series?: NormalizedSeries
  ): number;

  abstract createGridAndLabels(
    gridGroup: Svg,
    labelGroup: Svg,
    chartOptions: OptionsWithDefaults,
    eventEmitter: EventEmitter
  ): void;
}
