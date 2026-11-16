import { quantity } from './lang';

describe('Core', () => {
  describe('Lang', () => {
    describe('quantity', () => {
      it('should return value for numbers', () => {
        expect(quantity(100)).toEqual({ value: 100 });
        expect(quantity(0)).toEqual({ value: 0 });
        expect(quantity(NaN)).toEqual({ value: NaN });
        expect(quantity(null)).toEqual({ value: 0 });
        expect(quantity(undefined)).toEqual({ value: NaN });
      });

      it('should return value without unit from string', () => {
        expect(quantity('100')).toEqual({ value: 100, unit: undefined });
        expect(quantity('0')).toEqual({ value: 0, unit: undefined });
      });

      it('should return value and unit from string', () => {
        expect(quantity('100%')).toEqual({ value: 100, unit: '%' });
        expect(quantity('100 %')).toEqual({ value: 100, unit: '%' });
        expect(quantity('0px')).toEqual({ value: 0, unit: 'px' });
      });

      it.each([
        { input: '40.5%', value: 40.5, unit: '%' },
        { input: '0.5s', value: 0.5, unit: 's' },
        { input: '.5s', value: 0.5, unit: 's' },
        { input: '-0.5s', value: -0.5, unit: 's' },
        { input: '+2.5 ms', value: 2.5, unit: 'ms' },
        { input: '1.5', value: 1.5, unit: undefined }
      ])(
        'parses $input without including the number in its unit',
        ({ input, value, unit }) => {
          expect(quantity(input)).toEqual({ value, unit });
        }
      );
    });
  });
});
