import { splitIntoSegments } from './segments';

describe('Core', () => {
  describe('Data', () => {
    describe('Segments', () => {
      function makeValues<T>(arr: T[]) {
        return arr.map((x, i) => ({ value: x, valueIndex: i }));
      }

      it('should return empty array for empty input', () => {
        expect(splitIntoSegments([], [])).toEqual([]);
      });

      it('should remove undefined values', () => {
        const coords = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const values = makeValues([1, undefined, undefined, 4, undefined, 6]);

        expect(splitIntoSegments(coords, values)).toEqual([
          {
            pathCoordinates: [1, 2],
            valueData: [{ value: 1, valueIndex: 0 }]
          },
          {
            pathCoordinates: [7, 8],
            valueData: [{ value: 4, valueIndex: 3 }]
          },
          {
            pathCoordinates: [11, 12],
            valueData: [{ value: 6, valueIndex: 5 }]
          }
        ]);
      });

      it('should respect fillHoles option', () => {
        const coords = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
        const values = makeValues([1, undefined, undefined, 4, undefined, 6]);
        const options = {
          fillHoles: true
        };

        expect(splitIntoSegments(coords, values, options)).toEqual([
          {
            pathCoordinates: [1, 2, 7, 8, 11, 12],
            valueData: [
              { value: 1, valueIndex: 0 },
              { value: 4, valueIndex: 3 },
              { value: 6, valueIndex: 5 }
            ]
          }
        ]);
      });

      it('should respect increasingX option', () => {
        const coords = [1, 2, 3, 4, 5, 6, 5, 6, 7, 8, 1, 2];
        const values = makeValues([1, 2, 3, 4, 5, 6]);
        const options = {
          increasingX: true
        };

        expect(splitIntoSegments(coords, values, options)).toEqual([
          {
            pathCoordinates: [1, 2, 3, 4, 5, 6],
            valueData: [
              { value: 1, valueIndex: 0 },
              { value: 2, valueIndex: 1 },
              { value: 3, valueIndex: 2 }
            ]
          },
          {
            pathCoordinates: [5, 6, 7, 8],
            valueData: [
              { value: 4, valueIndex: 3 },
              { value: 5, valueIndex: 4 }
            ]
          },
          {
            pathCoordinates: [1, 2],
            valueData: [{ value: 6, valueIndex: 5 }]
          }
        ]);
      });
    });
  });
});
