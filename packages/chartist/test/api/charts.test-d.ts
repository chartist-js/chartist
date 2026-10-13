import {
  BarChart,
  LineChart,
  PieChart,
  type BarChartData,
  type BarChartOptions,
  type Data,
  type LineChartData,
  type LineChartOptions,
  type PieChartData,
  type PieChartOptions,
  type ResponsiveOptions
} from 'chartist';

declare const element: Element;

describe('chart constructors', () => {
  test('LineChart takes a query or element, data, options and responsive options', () => {
    const data: LineChartData = {
      labels: ['Mon', 'Tue'],
      series: [[1, 2], { name: 'b', data: [3, 4] }]
    };
    const options: LineChartOptions = { showArea: true, low: 0 };
    const responsive: ResponsiveOptions<LineChartOptions> = [
      ['screen and (max-width: 640px)', { showPoint: false }]
    ];
    expectTypeOf(new LineChart('#chart', data)).toEqualTypeOf<LineChart>();
    expectTypeOf(
      new LineChart(element, data, options, responsive)
    ).toEqualTypeOf<LineChart>();
    expectTypeOf(new LineChart(null, data)).toEqualTypeOf<LineChart>();
  });

  test('BarChart and PieChart take their own data and options', () => {
    const bars: BarChartData = { labels: ['a', 'b'], series: [[1, 2]] };
    const barOptions: BarChartOptions = {
      stackBars: true,
      horizontalBars: true
    };
    const pie: PieChartData = { series: [10, 20, 30] };
    const pieOptions: PieChartOptions = { donut: true, donutWidth: 40 };
    expectTypeOf(
      new BarChart('#bar', bars, barOptions)
    ).toEqualTypeOf<BarChart>();
    expectTypeOf(
      new PieChart('#pie', pie, pieOptions)
    ).toEqualTypeOf<PieChart>();
  });

  test('invalid options and data are rejected', () => {
    // @ts-expect-error showLine is a boolean
    new LineChart('#chart', { series: [] }, { showLine: 'yes' });
    // @ts-expect-error donut is a PieChart option
    new BarChart('#chart', { series: [] }, { donut: true });
    // @ts-expect-error series is required
    new LineChart('#chart', { labels: [] });
    // @ts-expect-error a chart needs a target
    new PieChart();
  });

  test('chart data types extend Data', () => {
    expectTypeOf<LineChartData>().toExtend<Data>();
    expectTypeOf<BarChartData>().toExtend<Data>();
    expectTypeOf<PieChartData>().toExtend<Data>();
  });
});

describe('chart methods', () => {
  const chart = new LineChart('#chart', { series: [[1, 2]] });

  test('update takes optional data, options and an override flag', () => {
    chart.update();
    chart.update({ series: [[3]] });
    // 1.5 types these options as the base Options, so chart-specific
    // options (e.g. showArea) don't compile here. Widening that is allowed.
    chart.update(undefined, { low: 0 }, true);
    expectTypeOf(chart.update).parameter(0).toEqualTypeOf<Data | undefined>();
    expectTypeOf(chart.update)
      .parameter(2)
      .toEqualTypeOf<boolean | undefined>();
  });

  test('on and off are chainable and accept "*"', () => {
    const listener = (data: unknown) => void data;
    expectTypeOf(chart.on('draw', listener)).toEqualTypeOf<LineChart>();
    expectTypeOf(chart.off('draw', listener)).toEqualTypeOf<LineChart>();
    expectTypeOf(chart.off('draw')).toEqualTypeOf<LineChart>();
    expectTypeOf(
      chart.on('*', (event: string, data: unknown) => void [event, data])
    ).toEqualTypeOf<LineChart>();
  });

  test('detach takes no arguments', () => {
    expectTypeOf(chart.detach).parameters.toEqualTypeOf<[]>();
  });
});
