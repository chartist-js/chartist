// @vitest-environment node
import {
  barChartConfig,
  estimateText,
  findAll,
  lineChartConfig,
  pieChartConfig,
  renderToString,
  seriesColors,
  textAscent,
  toScene
} from 'chartist';
import { dotsLayer } from './layers.v2.ts';

describe('server-side rendering (v2)', () => {
  test('toScene and renderToString work without a DOM', () => {
    expect(typeof document).toBe('undefined');
    const svg = renderToString(
      toScene(
        { data: { series: [[1, 2]] }, layers: [dotsLayer()] },
        { width: 600, height: 300 }
      )
    );
    expect(svg).toMatch(/^<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    expect(svg).toContain('width="600" height="300"');
    expect(svg.match(/<circle /g)).toHaveLength(2);
    expect(svg).toContain('ct:value="2"');
  });

  test('equal inputs give equal output', () => {
    const render = () =>
      renderToString(
        toScene(
          { data: { series: [[3, 1]] }, layers: [dotsLayer()] },
          { width: 100, height: 50 }
        )
      );
    expect(render()).toBe(render());
  });
});

describe('estimateText (v2)', () => {
  test('estimates text sizes without a DOM', () => {
    expect(estimateText('Hello', { fontSize: 10 })).toEqual({
      width: 30,
      height: 12,
      fontSize: 10
    });
    expect(estimateText('Hi').fontSize).toBe(12);
  });
});

describe('preset configs (v2)', () => {
  const data = { labels: ['Mon', 'Tue', 'Wed'], series: [[5, 2, 4]] };

  test('lineChartConfig renders the line preset without a DOM', () => {
    expect(typeof document).toBe('undefined');
    const svg = renderToString(
      toScene(lineChartConfig(data, { showArea: true }), {
        width: 600,
        height: 300
      })
    );
    expect(svg).toContain('ct-chart-line');
    expect(svg).toContain('class="ct-area"');
    expect(svg.match(/class="ct-point"/g)).toHaveLength(3);
  });

  test('barChartConfig takes the bar options', () => {
    const scene = toScene(barChartConfig(data, { horizontalBars: true }), {
      width: 600,
      height: 300
    });
    const bars = findAll(scene, { role: 'bar' });
    expect(bars).toHaveLength(3);
    expect(bars.every(bar => bar.attrs.y1 === bar.attrs.y2)).toBe(true);
  });

  test('pieChartConfig renders slices and labels', () => {
    const svg = renderToString(
      toScene(pieChartConfig({ labels: ['A', 'B'], series: [3, 1] }), {
        width: 300,
        height: 300
      })
    );
    expect(svg.match(/class="ct-slice-pie"/g)).toHaveLength(2);
    expect(svg).toContain('>A</text>');
  });
});

describe('renderer data (v2)', () => {
  test('seriesColors are the default series colors', () => {
    expect(seriesColors).toHaveLength(15);
    expect(seriesColors[0]).toBe('#d70206');
    expect(seriesColors.every(color => /^#[0-9a-f]{6}$/.test(color))).toBe(
      true
    );
  });

  test('textAscent places the baseline of SVG text labels', () => {
    const scene = toScene(lineChartConfig({ labels: ['A'], series: [[1]] }), {
      width: 300,
      height: 150,
      measureText: text => ({
        width: text.length * 10,
        height: 20,
        fontSize: 20
      })
    });
    const label = findAll(scene, { role: 'label' }).find(
      node => node.ctx.kind === 'axis' && node.ctx.axis.dimension === 'x'
    );
    // X labels sit at the top of their box: one line, its baseline at the
    // ascent.
    expect(label?.ctx.kind).toBe('axis');
    if (label?.ctx.kind === 'axis') {
      const line = label.children[0];
      expect(Number(line.attrs.y) - label.ctx.y).toBeCloseTo(
        textAscent * 20,
        1
      );
    }
  });
});
