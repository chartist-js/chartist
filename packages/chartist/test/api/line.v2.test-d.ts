import {
  AutoScaleAxis,
  autoScaleAxis,
  fixedScaleAxis,
  line,
  lineChart,
  stepAxis,
  type AxisFactory,
  barChart,
  pieChart,
  type ChartHandle,
  type BarChartPresetOptions,
  type Layer,
  type LineChartPresetOptions,
  type PieChartPresetOptions,
  type PresetHandle,
  type ScaleAxis
} from 'chartist';

describe('line preset types', () => {
  test('lineChart takes 1.x arguments and returns a handle', () => {
    expectTypeOf(
      lineChart('#c', { labels: ['a'], series: [[1]] }, { showArea: true }, [
        ['(max-width: 600px)', { showPoint: false }]
      ])
    ).toEqualTypeOf<PresetHandle<LineChartPresetOptions>>();
    expectTypeOf(barChart('#c', { series: [[1]] })).toEqualTypeOf<
      PresetHandle<BarChartPresetOptions>
    >();
    expectTypeOf(pieChart('#c', { series: [1] })).toEqualTypeOf<
      PresetHandle<PieChartPresetOptions>
    >();
    expectTypeOf(lineChart('#c', { series: [] })).toExtend<ChartHandle>();
    // @ts-expect-error showArea is a boolean
    lineChart('#c', { series: [] }, { showArea: 'yes' });
  });

  test('setOptions takes the options of the preset', () => {
    const chart = lineChart('#c', { series: [[1]] });
    expectTypeOf(chart.setOptions({ showArea: true })).toEqualTypeOf<
      PresetHandle<LineChartPresetOptions>
    >();
    chart.setOptions({ showPoint: false }, { replace: true });
    // @ts-expect-error showArea is a boolean
    chart.setOptions({ showArea: 'yes' });
    // @ts-expect-error stackBars is a bar chart option
    chart.setOptions({ stackBars: true });
    // @ts-expect-error plugins can't change
    chart.setOptions({ plugins: [] });
    barChart('#c', { series: [[1]] }).setOptions({ horizontalBars: true });
    pieChart('#c', { series: [1] }).setOptions({ donut: true });
    // @ts-expect-error donut is a pie chart option
    barChart('#c', { series: [[1]] }).setOptions({ donut: true });
  });

  test('chained calls keep the preset handle', () => {
    expectTypeOf(
      lineChart('#c', { series: [[1]] })
        .on('mount', () => undefined)
        .off('mount')
        .update({})
        .detach()
    ).toEqualTypeOf<PresetHandle<LineChartPresetOptions>>();
  });

  test('presets take phase listeners in on', () => {
    lineChart(
      '#c',
      { series: [[1]] },
      {
        on: {
          mount: ({ elementOf }) => {
            expectTypeOf(elementOf).toBeFunction();
          },
          compose: current =>
            current.role === 'point' ? current.addClass('x') : undefined,
          '*': (name, payload) => void [name, payload]
        }
      }
    );
    barChart('#c', { series: [[1]] }, { on: { scene: () => undefined } });
    pieChart('#c', { series: [1] }, { on: { render: () => undefined } });
    // @ts-expect-error not a phase
    lineChart('#c', { series: [[1]] }, { on: { mounted: () => undefined } });
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
      line({ showArea: true, overrides: { a: { showPoint: false } } })
    ).toEqualTypeOf<Layer>();
  });
});
