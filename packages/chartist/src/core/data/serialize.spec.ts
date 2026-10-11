import { serialize, deserialize } from './serialize';

describe('Core', () => {
  describe('Data', () => {
    describe('Serialize', () => {
      it('should serialize and deserialize regular strings', () => {
        const input = 'String test';
        expect(input).toMatch(deserialize(serialize(input)));
      });

      it('should serialize and deserialize strings with critical characters', () => {
        const input = 'String test with critical characters " < > \' & &amp;';
        expect(input).toMatch(deserialize(serialize(input)));
      });

      it('should serialize and deserialize numbers', () => {
        const input = 12345.6789;
        expect(input).toEqual(deserialize(serialize(input)));
      });

      it('should serialize and deserialize dates', () => {
        const input = new Date(0);
        expect(+input).toEqual(+new Date(deserialize(serialize(input))));
      });

      it('should serialize and deserialize complex object types', () => {
        const input = {
          a: {
            b: 100,
            c: 'String test',
            d: 'String test with critical characters " < > \' & &amp;',
            e: {
              f: 'String test'
            }
          }
        };

        expect(input).toEqual(deserialize(serialize(input)));
      });

      it('should serialize and deserialize null, undefined and NaN', () => {
        expect(null).toEqual(deserialize(serialize(null)));
        expect(undefined).toEqual(deserialize(serialize(undefined)));
        expect(deserialize(serialize(NaN))).toBeNaN();
      });
    });
  });
});
