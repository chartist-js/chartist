import {StepAxis} from './step-axis';

describe('StepAxis', function() {
  it('should return 0 if options.ticks.length == 1', function() {
    var ticks = [1],
      axisUnit = {
        'pos':'y',
        'len':'height',
        'dir':'vertical',
        'rectStart':'y2',
        'rectEnd':'y1',
        'rectOffset':'x1'
      },
      data = [[1]],
      chartRect = {
        'y2':0,
        'y1':15,
        'x1':50,
        'x2':100
      },
      options = {
        'ticks': ticks
      },
      stepAxis = new StepAxis(axisUnit, data, chartRect, options);
    expect(stepAxis.stepLength).toEqual(15);
  });
});
