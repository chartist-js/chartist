import { normalizeData } from './normalize';

describe('Core', () => {
  describe('Data', () => {
    describe('Normalize', () => {
      it('should normalize mixed series types correctly', () => {
        const data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            { data: [1, 0, 3, 4, 5, 6] },
            [1, { value: 0 }, 3, { value: 4 }, 5, 6, 7, 8],
            { data: [1, 0, { value: 3 }] }
          ]
        };

        expect(normalizeData(data).series).toEqual([
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]);
      });

      it('should normalize mixed series for pie chart correctly', () => {
        const data = {
          series: [1, { value: 0 }, 3, { value: 4 }, 5, 6, 7, 8]
        };

        expect(normalizeData(data).series).toEqual([1, 0, 3, 4, 5, 6, 7, 8]);
      });

      it('should normalize mixed series with string values for pie chart correctly', () => {
        const data = {
          series: ['1', { value: '0' }, '3', { value: '4' }, '5', '6', '7', '8']
        };

        expect(normalizeData(data).series).toEqual([1, 0, 3, 4, 5, 6, 7, 8]);
      });

      it('should normalize mixed series types with string values correctly', () => {
        const data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            { data: ['1', '0', '3', '4', '5', '6'] },
            ['1', { value: '0' }, '3', { value: '4' }, '5', '6', '7', '8'],
            { data: ['1', '0', { value: '3' }] }
          ]
        };

        expect(normalizeData(data).series).toEqual([
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]);
      });

      it('should normalize mixed series types with weird values correctly', () => {
        const data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            { data: [null, NaN, undefined, '4', '5', '6'] },
            ['1', { value: null }, '3', { value: NaN }, '5', '6', '7', '8'],
            { data: ['1', '0', { value: undefined }] }
          ]
        };

        expect(normalizeData(data).series).toEqual([
          [undefined, undefined, undefined, 4, 5, 6],
          [1, undefined, 3, undefined, 5, 6, 7, 8],
          [1, 0, undefined]
        ]);
      });

      it('should normalize correctly with 0 values in data series array objects', () => {
        const data = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          series: [
            {
              data: [
                { value: 1 },
                { value: 4 },
                { value: 2 },
                { value: 7 },
                { value: 2 },
                { value: 0 }
              ]
            }
          ]
        };

        expect(normalizeData(data).series).toEqual([[1, 4, 2, 7, 2, 0]]);
      });

      it('should normalize correctly with mixed dimensional input into multi dimensional output', () => {
        const data = {
          labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
          series: [
            {
              data: [
                { value: 1 },
                { value: { y: 4, x: 1 } },
                { y: 2, x: 2 },
                NaN,
                null,
                { value: 7 },
                { value: 2 },
                { value: null },
                { y: undefined, x: NaN }
              ]
            }
          ]
        };

        expect(normalizeData(data, false, true).series).toEqual([
          [
            { x: undefined, y: 1 },
            { x: 1, y: 4 },
            { x: 2, y: 2 },
            undefined,
            undefined,
            { x: undefined, y: 7 },
            { x: undefined, y: 2 },
            undefined,
            undefined
          ]
        ]);
      });

      it('should normalize boolean series correctly', () => {
        const data = {
          series: [[true, false, false, true]]
        };

        expect(normalizeData(data).series).toEqual([[1, 0, 0, 1]]);
      });

      it('should normalize date series correctly', () => {
        const data = {
          series: [[new Date(0), new Date(1), new Date(2), new Date(3)]]
        };

        expect(normalizeData(data).series).toEqual([[0, 1, 2, 3]]);
      });
    });
  });
});
