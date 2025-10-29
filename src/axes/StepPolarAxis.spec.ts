import { StepPolarAxis } from './StepPolarAxis';

describe('Axes', () => {
  describe('StepPolarAxis', () => {
    it('should return 0 if options.ticks.length == 1', () => {
      const ticks = [1];
      const axisUnit = {
        pos: 'y',
        len: 'height',
        dir: 'radial',
        rectStart: 'y2',
        rectEnd: 'y1',
        rectOffset: 'x1'
      } as const;
      const data = [[1]];
      const chartRect: any = {
        y2: 0,
        y1: 30,
        x1: 50,
        x2: 100,
        width() {
          return this.x2 - this.x1;
        },
        height() {
          return this.y1 - this.y2;
        }
      };
      const options = {
        ticks
      };
      const stepAxis: any = new StepPolarAxis(
        axisUnit,
        data,
        chartRect,
        options
      );
      expect(stepAxis.stepLength).toEqual(15);
    });
  });
});
