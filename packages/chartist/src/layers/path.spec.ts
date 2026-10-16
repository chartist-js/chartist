import type { SegmentData } from '../core/types';
import { cardinal } from '../interpolation/cardinal';
import { monotoneCubic } from '../interpolation/monotoneCubic';
import { none } from '../interpolation/none';
import { simple } from '../interpolation/simple';
import { step } from '../interpolation/step';
import { SvgPath } from '../svg/SvgPath';
import { reversePath } from './path';

// Five points with a hole in the middle: two pieces.
const coordinates = [0, 10, 10, 30, 20, 0, 30, 20, 40, 5, 50, 25];
const values = [1, 3, undefined, 2, 0.5, 2.5];
const data: SegmentData[] = values.map((value, valueIndex) => ({
  value: value === undefined ? undefined : { x: valueIndex, y: value },
  valueIndex
}));

/** The path's commands and points, rounded, for comparing paths. */
function shape(path: SvgPath) {
  return path.pathElements.map(({ command, data: _data, ...params }) => [
    command,
    ...Object.values(params).map(n => Math.round(n * 1000) / 1000)
  ]);
}

describe('layers/path reversePath', () => {
  const interpolations = {
    none: none(),
    simple: simple(),
    monotoneCubic: monotoneCubic(),
    cardinal: cardinal(),
    step: step()
  };

  for (const [name, interpolation] of Object.entries(interpolations)) {
    it(`traces a ${name} path backward`, () => {
      const path = interpolation(coordinates, data);
      const reversed = reversePath(path);
      const moves = (p: SvgPath) =>
        p.pathElements.filter(e => e.command === 'M').length;

      expect(moves(reversed)).toBe(moves(path));
      const last = path.pathElements[path.pathElements.length - 1];
      expect([reversed.pathElements[0].x, reversed.pathElements[0].y]).toEqual([
        last.x,
        last.y
      ]);
      expect(reversed.pathElements).toHaveLength(path.pathElements.length);
      expect(shape(reversePath(reversed))).toEqual(shape(path));
    });
  }

  it('swaps the control points of a curve', () => {
    const path = new SvgPath().move(0, 0).curve(1, 2, 3, 4, 5, 6);
    expect(shape(reversePath(path))).toEqual([
      ['M', 5, 6],
      ['C', 3, 4, 1, 2, 0, 0]
    ]);
  });

  it('throws for arcs', () => {
    const path = new SvgPath().move(0, 0).arc(5, 5, 0, 0, 1, 10, 0);
    expect(() => reversePath(path)).toThrow(/"A" commands/);
  });
});
