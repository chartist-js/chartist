import type {
  Label,
  ChartRect,
  OptionsWithDefaults,
  NormalizedSeriesPrimitiveValue,
  NormalizedSeries
} from '../core';
import type { Svg } from '../svg';
import type { EventEmitter } from '../event';
import { isFalseyButZero } from '../utils';
import { createGrid, createLabel } from '../core';

export const axisUnits = {
  x: {
    pos: 'x',
    len: 'width',
    dir: 'horizontal',
    rectStart: 'x1',
    rectEnd: 'x2',
    rectOffset: 'y2'
  },
  y: {
    pos: 'y',
    len: 'height',
    dir: 'vertical',
    rectStart: 'y2',
    rectEnd: 'y1',
    rectOffset: 'x1'
  }
} as const;

export type XAxisUnits = typeof axisUnits.x;
export type YAxisUnits = typeof axisUnits.y;
export type AxisUnits = XAxisUnits | YAxisUnits;

export abstract class Axis {
  public readonly counterUnits: AxisUnits;
  public readonly range:
    | {
        min: number;
        max: number;
      }
    | undefined;
  readonly axisLength: number;
  private readonly gridOffset: number;

  constructor(
    public readonly units: AxisUnits,
    private readonly chartRect: ChartRect,
    private readonly ticks: Label[]
  ) {
    this.counterUnits = units === axisUnits.x ? axisUnits.y : axisUnits.x;
    this.axisLength =
      chartRect[this.units.rectEnd] - chartRect[this.units.rectStart];
    this.gridOffset = chartRect[this.units.rectOffset];
  }

  abstract projectValue(
    value: NormalizedSeriesPrimitiveValue | Label,
    index?: number,
    series?: NormalizedSeries
  ): number;

  createGridAndLabels(
    gridGroup: Svg,
    labelGroup: Svg,
    chartOptions: OptionsWithDefaults,
    eventEmitter: EventEmitter
  ) {
    const axisOptions =
      this.units.pos === 'x' ? chartOptions.axisX : chartOptions.axisY;
    const projectedValues = this.ticks.map((tick, i) =>
      this.projectValue(tick, i)
    );
    const labelValues = this.ticks.map(axisOptions.labelInterpolationFnc);

    projectedValues.forEach((projectedValue, index) => {
      const labelValue = labelValues[index];
      const labelOffset = {
        x: 0,
        y: 0
      };

      // TODO: Find better solution for solving this problem
      // Calculate how much space we have available for the label
      let labelLength;
      if (projectedValues[index + 1]) {
        // If we still have one label ahead, we can calculate the distance to the next tick / label
        labelLength = projectedValues[index + 1] - projectedValue;
      } else {
        // If we don't have a label ahead and we have only two labels in total, we just take the remaining distance to
        // on the whole axis length. We limit that to a minimum of 30 pixel, so that labels close to the border will
        // still be visible inside of the chart padding.
        labelLength = Math.max(this.axisLength - projectedValue, 30);
      }

      // Skip grid lines and labels where interpolated label values are falsey (except for 0)
      if (labelValue !== '' && isFalseyButZero(labelValue)) {
        return;
      }

      // Transform to global coordinates using the chartRect
      // We also need to set the label offset for the createLabel function
      if (this.units.pos === 'x') {
        projectedValue = this.chartRect.x1 + projectedValue;
        labelOffset.x = chartOptions.axisX.labelOffset.x;

        // If the labels should be positioned in start position (top side for vertical axis) we need to set a
        // different offset as for positioned with end (bottom)
        if (chartOptions.axisX.position === 'start') {
          labelOffset.y =
            this.chartRect.padding.top + chartOptions.axisX.labelOffset.y + 5;
        } else {
          labelOffset.y =
            this.chartRect.y1 + chartOptions.axisX.labelOffset.y + 5;
        }
      } else {
        projectedValue = this.chartRect.y1 - projectedValue;
        labelOffset.y = chartOptions.axisY.labelOffset.y - labelLength;

        // If the labels should be positioned in start position (left side for horizontal axis) we need to set a
        // different offset as for positioned with end (right side)
        if (chartOptions.axisY.position === 'start') {
          labelOffset.x =
            this.chartRect.padding.left + chartOptions.axisY.labelOffset.x;
        } else {
          labelOffset.x =
            this.chartRect.x2 + chartOptions.axisY.labelOffset.x + 10;
        }
      }

      if (axisOptions.showGrid) {
        createGrid(
          projectedValue,
          index,
          this,
          this.gridOffset,
          this.chartRect[this.counterUnits.len](),
          gridGroup,
          [
            chartOptions.classNames.grid,
            chartOptions.classNames[this.units.dir]
          ],
          eventEmitter
        );
      }

      if (axisOptions.showLabel) {
        createLabel(
          projectedValue,
          labelLength,
          index,
          labelValue,
          this,
          axisOptions.offset,
          labelOffset,
          labelGroup,
          [
            chartOptions.classNames.label,
            chartOptions.classNames[this.units.dir],
            axisOptions.position === 'start'
              ? chartOptions.classNames[axisOptions.position]
              : chartOptions.classNames.end
          ],
          eventEmitter
        );
      }
    });
  }
}
