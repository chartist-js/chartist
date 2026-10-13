import type { MeasureText } from '../render/measure';
import { labelAlign, svgLabels, wrapText } from './svgLabels';

// 6 px per glyph, 10 px font: easy numbers.
const measure: MeasureText = text => ({
  width: text.length * 6,
  height: 12,
  fontSize: 10
});
const widthOf = (line: string) => line.length * 6;

describe('svgLabels: wrapping', () => {
  it('fills lines greedily within the width', () => {
    // 60 px = 10 glyphs per line.
    expect(wrapText('Quarterly revenue in thousands', 60, widthOf)).toEqual([
      'Quarterly',
      'revenue in',
      'thousands'
    ]);
  });

  it('keeps a word wider than the slot on its own line', () => {
    expect(wrapText('a supercalifragilistic b', 30, widthOf)).toEqual([
      'a',
      'supercalifragilistic',
      'b'
    ]);
  });

  it('keeps short text on one line and drops empty text', () => {
    expect(wrapText('Mon', 60, widthOf)).toEqual(['Mon']);
    expect(wrapText('  ', 60, widthOf)).toEqual([]);
  });

  it('builds no node for empty text', () => {
    const build = svgLabels(measure, 'line');
    expect(
      build('', { x: 0, y: 0, width: 50, height: 20 }, 'l', 'x', false)
    ).toBeUndefined();
  });
});

describe('svgLabels: alignment like the 1.x CSS', () => {
  it.each([
    ['line', 'x', true, 'bottom', 'start'],
    ['line', 'x', false, 'top', 'start'],
    ['line', 'y', true, 'bottom', 'end'],
    ['line', 'y', false, 'bottom', 'start'],
    ['bar', 'x', true, 'bottom', 'middle'],
    ['bar', 'x', false, 'top', 'middle'],
    ['bar', 'y', true, 'bottom', 'end'],
    ['horizontalBar', 'x', true, 'bottom', 'start'],
    ['horizontalBar', 'x', false, 'top', 'start'],
    ['horizontalBar', 'y', true, 'middle', 'end'],
    ['horizontalBar', 'y', false, 'middle', 'start']
  ] as const)('%s %s start=%s: %s %s', (kind, dim, atStart, v, h) => {
    expect(labelAlign(kind, dim, atStart)).toEqual({
      vertical: v,
      horizontal: h
    });
  });

  it('positions lines inside the box by the alignment', () => {
    const box = { x: 100, y: 50, width: 60, height: 40 };
    const top = svgLabels(measure, 'line')(
      'Quarterly revenue',
      box,
      'ct-label',
      'x',
      false
    )!;
    expect(top.name).toBe('text');
    expect(top.classes).toEqual(['ct-label']);
    expect(top.attrs['text-anchor']).toBe('start');
    expect(top.children.map(t => [t.attrs.x, t.attrs.y, t.content])).toEqual([
      [100, 58.5, 'Quarterly'],
      [100, 68.5, 'revenue']
    ]);

    const centered = svgLabels(measure, 'bar')('Mon', box, 'l', 'x', false)!;
    expect(centered.attrs).toMatchObject({ x: 130, 'text-anchor': 'middle' });

    // Bottom: the last line ends at the bottom of the box.
    const bottom = svgLabels(measure, 'line')('1 2', box, 'l', 'y', true)!;
    expect(bottom.attrs).toMatchObject({ x: 160, 'text-anchor': 'end' });
    expect(bottom.children[0].attrs.y).toBe(50 + 40 - 10 + 8.5);
  });

  it('takes alignment overrides', () => {
    const box = { x: 0, y: 0, width: 60, height: 40 };
    const label = svgLabels(measure, 'line', {
      horizontal: 'middle',
      vertical: 'middle'
    })('Mon', box, 'l', 'x', false)!;
    expect(label.attrs).toMatchObject({
      x: 30,
      y: 15 + 8.5,
      'text-anchor': 'middle'
    });
  });
});
