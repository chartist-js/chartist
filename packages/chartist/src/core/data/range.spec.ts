import { nonEmptyRange } from './range';

describe('Core', () => {
  describe('Data', () => {
    describe('nonEmptyRange', () => {
      it('keeps a range with high above low', () => {
        expect(nonEmptyRange({ high: 5, low: 2 })).toEqual({ high: 5, low: 2 });
      });

      it('repairs equal or crossed bounds by their sign', () => {
        expect(nonEmptyRange({ high: 0, low: 0 })).toEqual({ high: 1, low: 0 });
        expect(nonEmptyRange({ high: -3, low: -3 })).toEqual({
          high: 0,
          low: -3
        });
        expect(nonEmptyRange({ high: 0.627, low: 0.7 })).toEqual({
          high: 0.627,
          low: 0
        });
        expect(
          nonEmptyRange({ high: -Number.MAX_VALUE, low: Number.MAX_VALUE })
        ).toEqual({ high: 1, low: 0 });
      });
    });
  });
});
