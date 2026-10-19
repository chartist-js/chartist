// @vitest-environment node
import { chartistCss } from '../../test/chartist-css';
import { freezeDeep } from '../../test/freeze';
import { toScene } from '../chart/toScene';
import { lineChartConfig } from '../presets/lineChart';
import { findAll } from '../scene/tree';
import { applyStyles } from './applyStyles';
import { renderToString } from './string';
import { logScale } from '../../test/logScale';

const week = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [
    [12, 9, 7, 8, 5],
    [2, 1, 3.5, 7, 3]
  ]
};
const scene = () =>
  toScene(lineChartConfig(week, { showArea: true }), {
    width: 600,
    height: 300
  });

describe('server/applyStyles', () => {
  it("bakes Chartist's stylesheet into a line chart with SVG labels", () => {
    const styled = applyStyles(scene(), chartistCss);
    const [line] = findAll(styled, { role: 'line' });
    expect(line.attrs).toMatchObject({
      stroke: '#d70206',
      fill: 'none',
      'stroke-width': '4px'
    });
    const [grid] = findAll(styled, { role: 'grid' });
    expect(grid.attrs).toMatchObject({
      stroke: 'rgba(0, 0, 0, 0.2)',
      'stroke-width': '1px',
      'stroke-dasharray': '2px'
    });
    const [label] = findAll(styled, { role: 'label' });
    expect(label.name).toBe('text');
    expect(label.attrs).toMatchObject({
      fill: 'rgba(0, 0, 0, 0.4)',
      'font-size': '0.75rem'
    });
    const markup = renderToString(styled);
    expect(markup).not.toContain('var(');
    expect(markup).not.toContain('light-dark(');
    expect(markup).toContain('class="ct-line"');
  });

  it('takes a list of stylesheets in order and a color scheme', () => {
    const styled = applyStyles(
      scene(),
      [chartistCss, '.ct-series-a { --ct-color: teal; }'],
      { colorScheme: 'dark' }
    );
    expect(findAll(styled, { role: 'line' })[0].attrs.stroke).toBe('teal');
    expect(findAll(styled, { role: 'grid' })[0].attrs.stroke).toBe(
      'rgba(255, 255, 255, 0.2)'
    );
  });

  it('returns a new scene and leaves the given one unchanged', () => {
    const input = freezeDeep(scene());
    const before = renderToString(input);
    const styled = applyStyles(input, chartistCss);
    expect(styled).not.toBe(input);
    expect(renderToString(input)).toBe(before);
    expect(renderToString(styled)).not.toBe(before);
  });

  it('writes CSS values only as escaped attribute values', () => {
    const markup = renderToString(
      applyStyles(scene(), [
        '.ct-line { fill: "><script>alert(1)</script>; }',
        '.ct-point { stroke: red"><script>alert(2)</script> }'
      ])
    );
    expect(markup).not.toContain('<script');
    expect(markup).toContain('&lt;script&gt;alert(2)');
  });

  it('draws minor grid lines lighter, and restyles them alone', () => {
    const minor = toScene(
      lineChartConfig(
        { labels: ['a', 'b'], series: [[1, 100]] },
        { axisY: { type: logScale([2, 3, 20, 30]), low: 1, high: 100 } }
      ),
      { width: 600, height: 300 }
    );
    const grids = (css: string | string[]) => {
      const styled = applyStyles(minor, css);
      const all = findAll(styled, { role: 'grid' });
      return {
        minor: all.find(grid => grid.ctx.minor)!.attrs,
        major: all.find(grid => !grid.ctx.minor)!.attrs
      };
    };
    const plain = grids(chartistCss);
    expect(plain.minor).toMatchObject({
      stroke: 'rgba(0, 0, 0, 0.08)',
      'stroke-width': '1px'
    });
    expect(plain.minor['stroke-dasharray']).toBe('none');
    expect(plain.major.stroke).toBe('rgba(0, 0, 0, 0.2)');
    const red = grids([
      chartistCss,
      '.ct-chart-line { --ct-grid-minor-color: red; }'
    ]);
    expect(red.minor.stroke).toBe('red');
    expect(red.major.stroke).toBe('rgba(0, 0, 0, 0.2)');
  });
});
