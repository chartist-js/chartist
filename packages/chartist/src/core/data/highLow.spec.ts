import type { NormalizedSeries, Options } from '../types';
import { getHighLow } from './highLow';

const series = [
  [
    { x: 1, y: 12 },
    { x: 2, y: 18 }
  ]
] as NormalizedSeries[];
const range = (options: Options, dimension: 'x' | 'y' = 'y') =>
  getHighLow(series, options, dimension);

describe('Core', () => {
  describe('getHighLow', () => {
    it('finds the range of the values in a dimension', () => {
      expect(range({})).toEqual({ low: 12, high: 18 });
      expect(range({}, 'x')).toEqual({ low: 1, high: 2 });
    });

    it('widens the range to the reference value', () => {
      expect(range({ referenceValue: 0 })).toEqual({ low: 0, high: 18 });
      expect(range({ referenceValue: 30 })).toEqual({ low: 12, high: 30 });
    });

    it("an axis's own low and high win over the reference value (#1476)", () => {
      expect(range({ referenceValue: 0, axisY: { low: 10 } })).toEqual({
        low: 10,
        high: 18
      });
      expect(range({ referenceValue: 30, axisY: { high: 20 } })).toEqual({
        low: 12,
        high: 20
      });
      expect(range({ referenceValue: 0, low: 5 })).toEqual({
        low: 5,
        high: 18
      });
      // The reference value still widens the side that isn't set.
      expect(range({ referenceValue: 30, axisY: { low: 10 } })).toEqual({
        low: 10,
        high: 30
      });
    });
  });
});
