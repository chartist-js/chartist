import type { ChartRect } from '../core';
import { Svg } from '../svg';
import { EventEmitter } from '../event';
import { Axis, axisUnits } from './Axis';

class MockAxis extends Axis {
  projectValue(value: number) {
    return value;
  }
}

describe('Axes', () => {
  describe('Axis', () => {
    let ticks: number[];
    let chartRect: ChartRect;
    let chartOptions: any;
    let eventEmitter: EventEmitter;
    let gridGroup: Svg;
    let labelGroup: Svg;

    beforeEach(() => {
      eventEmitter = new EventEmitter();
      gridGroup = new Svg('g');
      labelGroup = new Svg('g');
      ticks = [1, 2];
      chartRect = {
        padding: {
          bottom: 5,
          left: 10,
          right: 15,
          top: 15
        },
        y2: 15,
        y1: 250,
        x1: 50,
        x2: 450,
        width() {
          return this.x2 - this.x1;
        },
        height() {
          return this.y1 - this.y2;
        }
      };

      chartOptions = {
        axisX: {
          offset: 30,
          position: 'end',
          labelOffset: {
            x: 0,
            y: 0
          },
          showLabel: true,
          showGrid: true
        },
        classNames: {
          label: 'ct-label',
          labelGroup: 'ct-labels',
          grid: 'ct-grid',
          gridGroup: 'ct-grids',
          vertical: 'ct-vertical',
          horizontal: 'ct-horizontal',
          start: 'ct-start',
          end: 'ct-end'
        }
      };
    });

    it('should skip all grid lines and labels for interpolated value of null', () => {
      chartOptions.axisX.labelInterpolationFnc = (
        value: number,
        index: number
      ) => (index === 0 ? null : value);

      const axis = new MockAxis(axisUnits.x, chartRect, ticks);

      axis.createGridAndLabels(
        gridGroup,
        labelGroup,
        chartOptions,
        eventEmitter
      );
      expect(
        (gridGroup.querySelectorAll('.ct-grid') as any).svgElements.length
      ).toBe(1);
      expect(
        (labelGroup.querySelectorAll('.ct-label') as any).svgElements.length
      ).toBe(1);
    });

    it('should skip all grid lines and labels for interpolated value of undefined', () => {
      chartOptions.axisX.labelInterpolationFnc = (
        value: number,
        index: number
      ) => (index === 0 ? undefined : value);

      const axis = new MockAxis(axisUnits.x, chartRect, ticks);

      axis.createGridAndLabels(
        gridGroup,
        labelGroup,
        chartOptions,
        eventEmitter
      );
      expect(
        (gridGroup.querySelectorAll('.ct-grid') as any).svgElements.length
      ).toBe(1);
      expect(
        (labelGroup.querySelectorAll('.ct-label') as any).svgElements.length
      ).toBe(1);
    });

    it('should include all grid lines and labels for interpolated value of empty strings', () => {
      chartOptions.axisX.labelInterpolationFnc = (
        value: number,
        index: number
      ) => (index === 0 ? '' : value);

      const axis = new MockAxis(axisUnits.x, chartRect, ticks);

      axis.createGridAndLabels(
        gridGroup,
        labelGroup,
        chartOptions,
        eventEmitter
      );
      expect(
        (gridGroup.querySelectorAll('.ct-grid') as any).svgElements.length
      ).toBe(2);
      expect(
        (labelGroup.querySelectorAll('.ct-label') as any).svgElements.length
      ).toBe(2);
    });
  });
});
