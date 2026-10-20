import { EDGE, place } from './place.ts';

const viewport = { width: 800, height: 600 };
const size = { width: 100, height: 40 };

describe('place', () => {
  it('centers the tooltip above its anchor', () => {
    expect(place({ x: 400, y: 300 }, size, viewport, 10)).toEqual({
      x: 350,
      y: 250,
      side: 'top'
    });
  });

  it('flips below when the top has no room', () => {
    expect(place({ x: 400, y: 30 }, size, viewport, 10)).toEqual({
      x: 350,
      y: 40,
      side: 'bottom'
    });
  });

  it('stays above when neither side has room', () => {
    const tall = { width: 100, height: 590 };
    expect(place({ x: 400, y: 300 }, tall, viewport, 10).side).toBe('top');
  });

  it('moves sideways to stay inside the viewport', () => {
    expect(place({ x: 5, y: 300 }, size, viewport, 10).x).toBe(EDGE);
    expect(place({ x: 795, y: 300 }, size, viewport, 10).x).toBe(
      800 - EDGE - 100
    );
  });

  it('keeps a corner tooltip inside: below, right edge in view', () => {
    const { x, y, side } = place({ x: 795, y: 5 }, size, viewport, 10);
    expect(side).toBe('bottom');
    expect(x + size.width).toBeLessThanOrEqual(800 - EDGE);
    expect(y).toBe(15);
  });

  it('starts a tooltip wider than the viewport at its left edge', () => {
    expect(
      place({ x: 400, y: 300 }, { width: 900, height: 40 }, viewport, 10).x
    ).toBe(EDGE);
  });
});
