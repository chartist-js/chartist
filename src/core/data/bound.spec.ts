import { getBounds } from './bounds';
import { roundWithPrecision } from '../math';

describe('Core', () => {
  describe('Data', () => {
    describe('Bounds', () => {
      it('should return 10 steps', () => {
        const bounds = getBounds(100, { high: 10, low: 1 }, 10, false);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(10);
        expect(bounds.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      });

      it('should return 5 steps', () => {
        const bounds = getBounds(100, { high: 10, low: 1 }, 20, false);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(10);
        expect(bounds.values).toEqual([1, 3, 5, 7, 9]);
      });

      it('should return non integer steps', () => {
        const bounds = getBounds(100, { high: 2, low: 1 }, 20, false);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(2);
        expect(bounds.values).toEqual([1, 1.25, 1.5, 1.75, 2]);
      });

      it('should return integer steps only', () => {
        const bounds = getBounds(100, { high: 3, low: 1 }, 20, true);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(3);
        expect(bounds.values).toEqual([1, 2, 3]);
      });

      it('should return single integer step', () => {
        const bounds = getBounds(100, { high: 2, low: 1 }, 20, true);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(2);
        expect(bounds.values).toEqual([1, 2]);
      });

      it('should floor/ceil min/max', () => {
        const bounds = getBounds(100, { high: 9.9, low: 1.01 }, 20, false);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(10);
        expect(bounds.values).toEqual([1, 3, 5, 7, 9]);
      });

      it('should floor/ceil min/max for non integers', () => {
        const bounds = getBounds(100, { high: 2.9, low: 1.01 }, 20, false);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(3);
        expect(bounds.values).toEqual([1, 1.5, 2, 2.5, 3]);
      });

      it('should floor/ceil min/max if integers only', () => {
        const bounds = getBounds(100, { high: 2.9, low: 1.01 }, 20, true);
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(3);
        expect(bounds.values).toEqual([1, 2, 3]);
      });

      it('should return neg and pos values', () => {
        const bounds = getBounds(100, { high: 1.9, low: -0.9 }, 20, false);
        expect(bounds.min).toBe(-1);
        expect(bounds.max).toBe(2);
        expect(bounds.values).toEqual([-1, 0, 1, 2]);
      });

      it('should return two steps if no space', () => {
        const bounds = getBounds(100, { high: 5, low: 0 }, 45, false);
        expect(bounds.min).toBe(0);
        expect(bounds.max).toBe(5);
        expect(bounds.values).toEqual([0, 4]);
      });

      it('should return single step if no space', () => {
        const bounds = getBounds(100, { high: 5, low: 0 }, 80, false);
        expect(bounds.min).toBe(0);
        expect(bounds.max).toBe(5);
        expect(bounds.values).toEqual([0]);
      });

      it('should return single step if range is less than epsilon', () => {
        const bounds = getBounds(
          100,
          { high: 1.0000000000000002, low: 1 },
          20,
          false
        );
        expect(bounds.min).toBe(1);
        expect(bounds.max).toBe(1.0000000000000002);
        expect(bounds.low).toBe(1);
        expect(bounds.high).toBe(1.0000000000000002);
        expect(bounds.values).toEqual([1]);
      });

      it('should return single step if range is less than smallest increment', () => {
        const bounds = getBounds(
          613.234375,
          { high: 1000.0000000000001, low: 999.9999999999997 },
          50,
          false
        );
        expect(bounds.min).toBe(999.9999999999999);
        expect(bounds.max).toBe(1000);
        expect(bounds.low).toBe(999.9999999999997);
        expect(bounds.high).toBe(1000.0000000000001);
        expect(bounds.values).toEqual([roundWithPrecision(999.9999999999999)]);
      });
    });
  });
});
