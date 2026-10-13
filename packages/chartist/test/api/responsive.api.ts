import {
  LineChart,
  type LineChartOptions,
  type OptionsChangedEvent,
  type ResponsiveOptions
} from 'chartist';
import { container, created, mockMedia, withCompat } from './fixture.ts';

const SMALL = 'screen and (max-width: 640px)';
const PRINT = 'print';
const responsive: ResponsiveOptions<LineChartOptions> = [
  [SMALL, { showPoint: false }],
  [PRINT, { showLine: false }]
];

describe('responsive options', () => {
  let media: ReturnType<typeof mockMedia>;
  afterEach(() => media.restore());

  test('matching queries apply their options on the first render', async () => {
    media = mockMedia([SMALL]);
    const el = container();
    await created(
      new LineChart(el, { series: [[1, 2]] }, withCompat({}), responsive)
    );
    expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
    expect(el.querySelectorAll('.ct-line')).toHaveLength(1);
  });

  test('later matches override earlier ones, in declaration order', async () => {
    media = mockMedia([SMALL, PRINT]);
    const el = container();
    await created(
      new LineChart(el, { series: [[1, 2]] }, withCompat({}), [
        [SMALL, { showArea: true, showPoint: false }],
        [PRINT, { showPoint: true }]
      ])
    );
    expect(el.querySelectorAll('.ct-point')).toHaveLength(2);
    expect(el.querySelectorAll('.ct-area')).toHaveLength(1);
  });

  test('a media change emits optionsChanged and re-renders', async () => {
    media = mockMedia();
    const el = container();
    const chart = new LineChart(
      el,
      { series: [[1, 2]] },
      withCompat({}),
      responsive
    );
    await created(chart);
    expect(el.querySelectorAll('.ct-point')).toHaveLength(2);

    const changed = vi.fn();
    chart.on('optionsChanged', changed);
    const next = created(chart);
    media.setMatches(SMALL, true);
    await next;

    expect(el.querySelectorAll('.ct-point')).toHaveLength(0);
    const event: OptionsChangedEvent<LineChartOptions> =
      changed.mock.calls[0][0];
    expect(event.previousOptions.showPoint).toBe(true);
    expect(event.currentOptions.showPoint).toBe(false);
  });

  test('detach stops listening to media changes', async () => {
    media = mockMedia();
    const chart = new LineChart(
      container(),
      { series: [[1]] },
      withCompat({}),
      responsive
    );
    await created(chart);
    expect(media.listenerCount(SMALL)).toBe(1);
    chart.detach();
    expect(media.listenerCount(SMALL)).toBe(0);
  });
});
