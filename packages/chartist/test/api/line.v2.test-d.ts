import {
  AutoScaleAxis,
  autoScaleAxis,
  fixedScaleAxis,
  line,
  lineChart,
  stepAxis,
  type AxisFactory,
  type ChartHandle,
  type Layer,
  type LineChartPresetOptions,
  type ScaleAxis
} from 'chartist';

describe('line preset types', () => {
  test('lineChart takes 1.x arguments and returns a handle', () => {
    expectTypeOf(
      lineChart('#c', { labels: ['a'], series: [[1]] }, { showArea: true }, [
        ['(max-width: 600px)', { showPoint: false }]
      ])
    ).toEqualTypeOf<ChartHandle>();
    // @ts-expect-error showArea is a boolean
    lineChart('#c', { series: [] }, { showArea: 'yes' });
  });

  test('axis types may be factories or 1.x classes', () => {
    const options: LineChartPresetOptions = {
      axisX: { type: stepAxis() },
      axisY: { type: AutoScaleAxis, onlyInteger: true }
    };
    expectTypeOf(options).toExtend<LineChartPresetOptions>();
    expectTypeOf(fixedScaleAxis()).toEqualTypeOf<AxisFactory>();
    expectTypeOf(autoScaleAxis().create).returns.toEqualTypeOf<ScaleAxis>();
  });

  test('line returns a layer', () => {
    expectTypeOf(
      line({ showArea: true, series: { a: { showPoint: false } } })
    ).toEqualTypeOf<Layer>();
  });
});
