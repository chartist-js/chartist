import type { Label, ChartRect, OptionsWithDefaults } from '../core';
import type { Svg } from '../svg';
import type { EventEmitter } from '../event';
import { isFalseyButZero } from '../utils';
import { createPolarGrid, createPolarLabel } from '../core';
import { Axis } from './Axis';

export const polarAxisUnits = {
  x: {
    pos: 'a',
    len: 'width',
    dir: 'angular',
    rectStart: 'x1',
    rectEnd: 'x2',
    rectOffset: 'y2'
  },
  y: {
    pos: 'r',
    len: 'height',
    dir: 'radial',
    rectStart: 'y2',
    rectEnd: 'y1',
    rectOffset: 'x1'
  }
} as const;

export type AngleAxisUnits = typeof polarAxisUnits.x;
export type RadiusAxisUnits = typeof polarAxisUnits.y;
export type PolarAxisUnits = AngleAxisUnits | RadiusAxisUnits;

export abstract class PolarAxis extends Axis {
  readonly counterUnits: PolarAxisUnits;
  readonly radius: number;
  readonly centerX: number;
  readonly centerY: number;

  constructor(
    public readonly units: PolarAxisUnits,
    chartRect: ChartRect,
    ticks: Label[]
  ) {
    const _radius =
      Math.min(chartRect.width(), chartRect.height()) / 2 -
      Math.min(chartRect.x1, chartRect.y1);
    const axisLength = units.pos === 'a' ? _radius * 2 * Math.PI : _radius;

    super(chartRect, ticks, axisLength, 0);
    this.radius = _radius;
    this.counterUnits =
      units === polarAxisUnits.x ? polarAxisUnits.y : polarAxisUnits.x;
    this.centerX = chartRect.width() / 2;
    this.centerY = chartRect.height() / 2;
  }

  createGridAndLabels(
    gridGroup: Svg,
    labelGroup: Svg,
    chartOptions: OptionsWithDefaults,
    eventEmitter: EventEmitter
  ) {
    const axisOptions =
      this.units.pos === 'a' ? chartOptions.axisX : chartOptions.axisY;
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
        labelLength = Math.max(
          this.axisLength - projectedValue,
          this.axisLength / this.ticks.length
        );
      }

      // Skip grid lines and labels where interpolated label values are falsey (except for 0)
      if (labelValue !== '' && isFalseyButZero(labelValue)) {
        return;
      }

      // Transform to global coordinates using the chartRect
      // We also need to set the label offset for the createLabel function
      if (this.units.pos === 'a') {
        labelOffset.x = chartOptions.axisX.labelOffset.x;
        labelOffset.y = chartOptions.axisX.labelOffset.y;
      } else {
        labelOffset.x = chartOptions.axisY.labelOffset.x;
        labelOffset.y = chartOptions.axisY.labelOffset.y;
      }

      if (axisOptions.showGrid) {
        createPolarGrid(
          projectedValue,
          index,
          this,
          this.gridOffset,
          this.axisLength,
          gridGroup,
          [
            chartOptions.classNames.grid,
            chartOptions.classNames[this.units.dir]
          ],
          eventEmitter
        );
      }

      if (axisOptions.showLabel) {
        createPolarLabel(
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
