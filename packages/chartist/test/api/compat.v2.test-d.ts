/**
 * The 1.x event and plugin types from `chartist/compat`: the same types as
 * the core's, which `chartist` marks as deprecated.
 */
import {
  lineChart,
  type CreatedEvent as CoreCreatedEvent,
  type OptionsChangedEvent as CoreOptionsChangedEvent,
  type PointDrawEvent as CorePointDrawEvent
} from 'chartist';
import {
  compat,
  type CreatedEvent,
  type OptionsChangedEvent,
  type Plugin,
  type PointDrawEvent
} from 'chartist/compat';

describe('1.x event and plugin types from chartist/compat', () => {
  test('are the core types', () => {
    expectTypeOf<PointDrawEvent>().toEqualTypeOf<CorePointDrawEvent>();
    expectTypeOf<CreatedEvent>().toEqualTypeOf<CoreCreatedEvent>();
  });

  test('keep their type parameters', () => {
    type Custom = { readonly fullWidth: true };
    expectTypeOf<OptionsChangedEvent<Custom>>().toEqualTypeOf<
      CoreOptionsChangedEvent<Custom>
    >();
  });

  test('type a draw listener on the functional API', () => {
    const chart = lineChart(
      '#chart',
      { series: [[1, 2, 3]] },
      { plugins: [compat] }
    );
    chart.on('draw', event => {
      if (event.type === 'point') {
        expectTypeOf(event).toEqualTypeOf<PointDrawEvent>();
      }
    });
  });

  test('type a 1.x plugin function', () => {
    const plugin: Plugin = chart => void chart;
    expectTypeOf(plugin).toBeFunction();
  });
});
