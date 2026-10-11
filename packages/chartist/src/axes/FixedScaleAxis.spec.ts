import { FixedScaleAxis } from './FixedScaleAxis';

describe('Axes', () => {
  describe('FixedScaleAxis', () => {
    it('should order the tick array', () => {
      const ticks = [10, 5, 0, -5, -10];
      const axisUnit = {
        pos: 'y',
        len: 'height',
        dir: 'vertical',
        rectStart: 'y2',
        rectEnd: 'y1',
        rectOffset: 'x1'
      } as const;
      const data = [
        [
          { x: 1, y: 10 },
          { x: 2, y: 5 },
          { x: 3, y: -5 }
        ]
      ];
      const chartRect: any = {
        padding: {
          top: 15,
          right: 15,
          bottom: 5,
          left: 10
        },
        y2: 15,
        y1: 141,
        x1: 50,
        x2: 269
      };
      const options = {
        offset: 40,
        position: 'start' as const,
        labelOffset: { x: 0, y: 0 },
        showLabel: true,
        showGrid: true,
        scaleMinSpace: 20,
        onlyInteger: false,
        ticks
      };
      const fsaxis: any = new FixedScaleAxis(
        axisUnit,
        data,
        chartRect,
        options
      );
      expect(fsaxis.ticks).toEqual([-10, -5, 0, 5, 10]);
    });
  });
});
