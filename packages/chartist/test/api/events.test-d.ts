import {
  LineChart,
  Svg,
  SvgPath,
  type AnimationEvent,
  type AreaDrawEvent,
  type BarChartCreatedEvent,
  type BarChartOptions,
  type BarDrawEvent,
  type Data,
  type DataEvent,
  type DrawEvent,
  type GridDrawEvent,
  type LabelDrawEvent,
  type LineChartCreatedEvent,
  type LineChartOptions,
  type LineDrawEvent,
  type OptionsChangedEvent,
  type PieChartCreatedEvent,
  type PointDrawEvent,
  type SliceDrawEvent,
  type SliceLabelDrawEvent
} from 'chartist';

describe('event payload types', () => {
  test('listeners can be annotated with the payload types', () => {
    const chart = new LineChart('#chart', { series: [[1]] });
    chart.on('data', (event: DataEvent) => void event);
    chart.on('draw', (event: PointDrawEvent | LineDrawEvent) => void event);
    chart.on('created', (event: LineChartCreatedEvent) => void event);
    chart.on('animationBegin', (event: AnimationEvent) => void event);
  });

  test('data and optionsChanged', () => {
    expectTypeOf<DataEvent['type']>().toEqualTypeOf<'initial' | 'update'>();
    expectTypeOf<DataEvent['data']>().toEqualTypeOf<Data>();
    expectTypeOf<
      OptionsChangedEvent<LineChartOptions>['currentOptions']
    >().toEqualTypeOf<LineChartOptions>();
  });

  test('draw events share the DrawEvent fields', () => {
    expectTypeOf<DrawEvent['element']>().toEqualTypeOf<Svg>();
    expectTypeOf<DrawEvent['group']>().toEqualTypeOf<Svg>();
    expectTypeOf<DrawEvent['index']>().toEqualTypeOf<number>();
    expectTypeOf<DrawEvent['seriesIndex']>().toEqualTypeOf<number>();
    expectTypeOf<PointDrawEvent>().toExtend<DrawEvent>();
    expectTypeOf<LineDrawEvent>().toExtend<DrawEvent>();
    expectTypeOf<AreaDrawEvent>().toExtend<DrawEvent>();
    expectTypeOf<BarDrawEvent>().toExtend<DrawEvent>();
  });

  test('draw event discriminants and specific fields', () => {
    expectTypeOf<PointDrawEvent['type']>().toEqualTypeOf<'point'>();
    expectTypeOf<PointDrawEvent['x']>().toEqualTypeOf<number>();
    expectTypeOf<LineDrawEvent['type']>().toEqualTypeOf<'line'>();
    expectTypeOf<LineDrawEvent['path']>().toEqualTypeOf<SvgPath>();
    expectTypeOf<AreaDrawEvent['type']>().toEqualTypeOf<'area'>();
    expectTypeOf<BarDrawEvent['type']>().toEqualTypeOf<'bar'>();
    expectTypeOf<BarDrawEvent['y2']>().toEqualTypeOf<number>();
    expectTypeOf<GridDrawEvent['type']>().toEqualTypeOf<'grid'>();
    expectTypeOf<LabelDrawEvent['type']>().toEqualTypeOf<'label'>();
    expectTypeOf<LabelDrawEvent['width']>().toEqualTypeOf<number>();
    expectTypeOf<SliceDrawEvent['type']>().toEqualTypeOf<'slice'>();
    expectTypeOf<SliceDrawEvent['radius']>().toEqualTypeOf<number>();
    expectTypeOf<SliceLabelDrawEvent['text']>().toEqualTypeOf<string>();
  });

  test('created events carry the svg and the chart options', () => {
    expectTypeOf<LineChartCreatedEvent['svg']>().toEqualTypeOf<Svg>();
    expectTypeOf<
      LineChartCreatedEvent['options']
    >().toEqualTypeOf<LineChartOptions>();
    expectTypeOf<
      BarChartCreatedEvent['options']
    >().toEqualTypeOf<BarChartOptions>();
    expectTypeOf<PieChartCreatedEvent>().not.toHaveProperty('axisX');
  });

  test('animation events', () => {
    expectTypeOf<AnimationEvent['element']>().toEqualTypeOf<Svg>();
    expectTypeOf<AnimationEvent['animate']>().toEqualTypeOf<Element>();
  });
});
