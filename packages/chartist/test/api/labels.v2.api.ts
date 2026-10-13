import {
  autoScaleAxis,
  axisLabels,
  barChart,
  cartesianAxes,
  chart,
  LineChart,
  lineChart,
  renderToString,
  stepAxis,
  toScene,
  type ChartConfig
} from 'chartist';
import { container } from './fixture.ts';

const SIZE = { width: 600, height: 300 };
const config = (extra: Partial<ChartConfig> = {}): ChartConfig => ({
  data: { labels: ['Q1', 'Q2'], series: [[1, 2]] },
  axes: cartesianAxes([
    { id: 'x', side: 'bottom', type: stepAxis(), ticks: ['Q1', 'Q2'] },
    { id: 'y', side: 'left', type: autoScaleAxis() }
  ]),
  layers: [axisLabels()],
  ...extra
});

describe('label modes (v2)', () => {
  test('browser default: HTML labels with the 1.x markup', () => {
    const el = container();
    lineChart(el, { labels: ['a', 'b'], series: [[1, 2]] }, SIZE);
    expect(
      el.querySelectorAll('.ct-labels foreignObject > span.ct-label').length
    ).toBeGreaterThan(0);
    expect(el.querySelector('.ct-labels text')).toBeNull();
  });

  test('string default: SVG text and no foreignObject', () => {
    const svg = renderToString(toScene(config(), SIZE));
    expect(svg).toContain('<text class="ct-label');
    expect(svg).toContain('<tspan');
    expect(svg).not.toContain('foreignObject');
  });

  test('opting in on a preset', () => {
    const el = container();
    barChart(
      el,
      { labels: ['a', 'b'], series: [[1, 2]] },
      { ...SIZE, labels: 'svg' }
    );
    expect(el.querySelector('foreignObject')).toBeNull();
    const labels = el.querySelectorAll('text.ct-label.ct-horizontal');
    expect(labels).toHaveLength(2);
    // Bar labels are centered on their step, as the 1.x CSS centers them.
    expect(labels[0].getAttribute('text-anchor')).toBe('middle');
  });

  test('the layer option overrides the chart option', () => {
    const el = container();
    chart(el, {
      ...config({ labels: 'svg', layers: [axisLabels({ labels: 'html' })] }),
      ...SIZE
    });
    expect(el.querySelector('.ct-labels foreignObject')).not.toBeNull();
    expect(el.querySelector('.ct-labels text')).toBeNull();
  });

  test('long labels wrap into tspans no wider than the slot', () => {
    const svg = renderToString(
      toScene(
        config({
          data: {
            labels: ['Quarterly revenue in thousands', 'b'],
            series: [[1, 2]]
          },
          axes: cartesianAxes([
            {
              id: 'x',
              side: 'bottom',
              type: stepAxis(),
              ticks: ['Quarterly revenue in thousands', 'b']
            },
            { id: 'y', side: 'left', type: autoScaleAxis() }
          ])
        }),
        { width: 200, height: 200 }
      )
    );
    const first = svg.match(/<text[^>]*ct-horizontal[^>]*>(.*?)<\/text>/)![1];
    expect(first.match(/<tspan/g)!.length).toBeGreaterThan(1);
  });

  test('the 1.x classes always draw HTML labels', async () => {
    const el = container();
    const legacy = new LineChart(el, { labels: ['a', 'b'], series: [[1, 2]] }, {
      ...SIZE,
      labels: 'svg'
    } as never);
    await new Promise(resolve => setTimeout(resolve));
    legacy.detach();
    expect(el.querySelector('foreignObject')).not.toBeNull();
    expect(el.querySelector('text.ct-label')).toBeNull();
  });
});
