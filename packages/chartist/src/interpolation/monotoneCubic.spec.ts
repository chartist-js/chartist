import type { SegmentData } from '../core';
import type { CurveParams, MoveParams, PathCommand, SvgPath } from '../svg';
import { monotoneCubic } from './monotoneCubic';

const values = (ys: (number | undefined)[]) =>
  ys.map((y, valueIndex) => ({ value: { y }, valueIndex })) as SegmentData[];

/** The path's curves as `[start, control 1, control 2, end]` point lists. */
function curves(path: SvgPath) {
  const result: number[][][] = [];
  let start = [0, 0];
  for (const element of path.pathElements) {
    if (element.command === 'C') {
      const { x, y, x1, y1, x2, y2 } = element as PathCommand<CurveParams>;
      result.push([start, [x1, y1], [x2, y2], [x, y]]);
    }
    const { x, y } = element as PathCommand<MoveParams>;
    start = [x, y];
  }
  return result;
}

/** The same curves, drawn from the other end. */
const reversed = (list: number[][][]) =>
  list.map(curve => [...curve].reverse()).reverse();

describe('Interpolation', () => {
  describe('monotoneCubic', () => {
    const ascending = [0, 10, 10, 0, 20, 10, 30, 5];
    const descending = [30, 5, 20, 10, 10, 0, 0, 10];

    it('connects descending x values with the curve of the sorted points (#1038)', () => {
      const path = monotoneCubic()(descending, values([5, 10, 0, 10]));
      expect(path.stringify()).toMatch(/^M[^M]+$/);
      expect(path.pathElements.map(element => element.command)).toEqual([
        'M',
        'C',
        'C',
        'C'
      ]);

      const sorted = curves(monotoneCubic()(ascending, values([10, 0, 10, 5])));
      const actual = curves(path);
      const expected = reversed(sorted);
      expect(actual).toHaveLength(expected.length);
      actual.forEach((curve, i) =>
        curve.forEach((point, j) => {
          expect(point[0]).toBeCloseTo(expected[i][j][0], 6);
          expect(point[1]).toBeCloseTo(expected[i][j][1], 6);
        })
      );
    });

    it('breaks where x turns back', () => {
      const coordinates = [0, 10, 10, 0, 20, 10, 10, 5, 0, 0, -10, 5];
      const data = values([1, 2, 1, 3, 2, 3]);
      const path = monotoneCubic()(coordinates, data);
      const there = monotoneCubic()(coordinates.slice(0, 6), data.slice(0, 3));
      const back = monotoneCubic()(coordinates.slice(6), data.slice(3));
      expect(path.stringify()).toBe(there.stringify() + back.stringify());
      expect(path.stringify().match(/M/g)).toHaveLength(2);
      expect(path.stringify().match(/C/g)).toHaveLength(4);
    });

    it('breaks where x repeats', () => {
      const coordinates = [0, 10, 10, 0, 10, 5, 20, 10];
      const path = monotoneCubic()(coordinates, values([1, 2, 3, 1]));
      expect(path.stringify()).toBe('M0,10L10,0M10,5L20,10');
    });

    it('still breaks at holes, unless fillHoles is set', () => {
      const coordinates = [30, 5, 20, 10, 10, 0, 0, 10];
      const holes = values([5, undefined, 0, 10]);
      expect(monotoneCubic()(coordinates, holes).stringify()).toBe(
        'M30,5M10,0L0,10'
      );
      expect(
        monotoneCubic({ fillHoles: true })(coordinates, holes).stringify()
      ).toMatch(/^M30,5C[^M]+C[^M]+$/);
    });
  });
});
