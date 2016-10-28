import {Svg} from '../svg/svg';
import {EventEmitter} from '../event/event-emitter';
import {Axis, axisUnits} from './axis';

describe('Axis', () => {
  let ticks, chartRect, chartOptions, eventEmitter, gridGroup, labelGroup;

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
      width: function() {
        return this.x2 - this.x1;
      },
      height: function() {
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
    chartOptions.axisX.labelInterpolationFnc =
      (value, index) => index === 0 ? null : value;

    const axis = new Axis();
    axis.initialize(axisUnits.x, chartRect, ticks, null);
    axis.projectValue = (value) => value;

    axis.createGridAndLabels(gridGroup, labelGroup, true, chartOptions, eventEmitter);
    expect(gridGroup.querySelectorAll('.ct-grid').svgElements.length).toBe(1);
    expect(labelGroup.querySelectorAll('.ct-label').svgElements.length).toBe(1);
  });

  it('should skip all grid lines and labels for interpolated value of undefined', function() {
    chartOptions.axisX.labelInterpolationFnc =
      (value, index) => index === 0 ? undefined : value;

    const axis = new Axis();
    axis.initialize(axisUnits.x, chartRect, ticks, null);
    axis.projectValue = (value) => value;

    axis.createGridAndLabels(gridGroup, labelGroup, true, chartOptions, eventEmitter);
    expect(gridGroup.querySelectorAll('.ct-grid').svgElements.length).toBe(1);
    expect(labelGroup.querySelectorAll('.ct-label').svgElements.length).toBe(1);
  });

  it('should include all grid lines and labels for interpolated value of empty strings', function() {
    chartOptions.axisX.labelInterpolationFnc =
      (value, index) => index === 0 ? '' : value;

    const axis = new Axis();
    axis.initialize(axisUnits.x, chartRect, ticks, null);
    axis.projectValue = (value) => value;

    axis.createGridAndLabels(gridGroup, labelGroup, true, chartOptions, eventEmitter);
    expect(gridGroup.querySelectorAll('.ct-grid').svgElements.length).toBe(2);
    expect(labelGroup.querySelectorAll('.ct-label').svgElements.length).toBe(2);
  });
});
