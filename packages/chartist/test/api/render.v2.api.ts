// @vitest-environment node
import { estimateText, renderToString, toScene } from 'chartist';
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
