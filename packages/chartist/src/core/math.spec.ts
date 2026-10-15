import { rho, roundWithPrecision } from './math';

describe('Core', () => {
  describe('Math', () => {
    describe('roundWithPrecision', () => {
      it('rounds to whole numbers with 0 digits (#1470)', () => {
        expect(roundWithPrecision(3.14159, 0)).toBe(3);
        expect(roundWithPrecision(3.5, 0)).toBe(4);
        expect(roundWithPrecision(-2.7, 0)).toBe(-3);
      });

      it('rounds to the given digits', () => {
        expect(roundWithPrecision(3.14159, 2)).toBe(3.14);
        expect(roundWithPrecision(3.14159, 4)).toBe(3.1416);
      });

      it('rounds to 8 digits without digits', () => {
        expect(roundWithPrecision(1.2345678901)).toBe(1.23456789);
        expect(roundWithPrecision(0.1 + 0.2)).toBe(0.3);
      });
    });

    describe('rho', () => {
      it('finds the smallest factor', () => {
        expect(rho(1)).toBe(1);
        expect(rho(12)).toBe(2);
        expect(rho(15)).toBe(3);
        expect(rho(49)).toBe(7);
      });

      it('returns non-finite input instead of looping (#1057)', () => {
        expect(rho(NaN)).toBeNaN();
        expect(rho(Infinity)).toBe(Infinity);
        expect(rho(-Infinity)).toBe(-Infinity);
      });
    });
  });
});
