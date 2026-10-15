import { runInNewContext } from 'node:vm';
import { extend } from './extend';

describe('Utils', () => {
  describe('extend', () => {
    it('should merge plain objects deeply', () => {
      const target = { a: 1, nested: { b: 2, c: 3 } };
      const result = extend(target, { nested: { c: 4 } }, { d: 5 });

      expect(result).toBe(target);
      expect(result).toEqual({ a: 1, nested: { b: 2, c: 4 }, d: 5 });
    });

    it('should replace a number with an object (#842)', () => {
      const result = extend(
        {},
        { chartPadding: 5 },
        { chartPadding: { top: 10 } }
      );

      expect(result).toEqual({ chartPadding: { top: 10 } });
    });

    it('should not change the source when it replaces a number', () => {
      const source = { chartPadding: { top: 10 } };
      const result = extend({}, { chartPadding: 5 }, source);
      (result.chartPadding as { top: number }).top = 20;

      expect(source.chartPadding.top).toBe(10);
    });

    it('should replace null and strings with an object', () => {
      expect(extend({ a: null, b: 'x' }, { a: { c: 1 }, b: { d: 2 } })).toEqual(
        { a: { c: 1 }, b: { d: 2 } }
      );
    });

    it('should replace an object with a number', () => {
      expect(
        extend({ chartPadding: { top: 10 } }, { chartPadding: 5 })
      ).toEqual({ chartPadding: 5 });
    });

    it('should replace arrays instead of merging them', () => {
      expect(extend({ ticks: [1, 2, 3] }, { ticks: [4] })).toEqual({
        ticks: [4]
      });
    });

    it('should keep an array from another realm an array (#876)', () => {
      const ticks = runInNewContext('[0, 5, 10]') as number[];
      expect(ticks instanceof Array).toBe(false);

      const result = extend(
        {},
        { axisY: { ticks: [1] } },
        { axisY: { ticks } }
      );

      expect(Array.isArray(result.axisY.ticks)).toBe(true);
      expect(result.axisY.ticks).toBe(ticks);
      expect([...result.axisY.ticks].sort((a, b) => b - a)).toEqual([10, 5, 0]);
    });

    it('should not pollute the prototype', () => {
      const source = JSON.parse(
        '{"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted": true}}}'
      ) as Record<string, unknown>;
      extend({}, source);
      extend({ nested: {} }, { nested: source });

      expect(({} as Record<string, unknown>).polluted).toBeUndefined();
      expect(Object.prototype).not.toHaveProperty('polluted');
    });
  });
});
