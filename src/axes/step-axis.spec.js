import {StepAxis} from './step-axis';

describe('StepAxis', function() {
  it('should return 0 if options.ticks.length == 1', function() {
    const ticks = [1];
    const axisUnit = {
      pos: 'y',
      len: 'height',
      dir: 'vertical',
      rectStart: 'y2',
      rectEnd: 'y1',
      rectOffset: 'x1'
    };
    const data = [[1]];
    const chartRect = {
      y2: 0,
      y1: 15,
      x1: 50,
      x2: 100
    };
    const options = {
      ticks
    };
    const stepAxis = new StepAxis(axisUnit, data, chartRect, options);
    expect(stepAxis.stepLength).toEqual(15);
  });
});
