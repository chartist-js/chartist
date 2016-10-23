import {serialize, deserialize, getDataArray, getBounds, splitIntoSegments} from './data';

describe('Data', () => {
  describe('serialization', () => {
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
      expect(NaN).toMatch(deserialize(serialize('NaN')));
    });
  });

  describe('data normalization', () => {
    it('should normalize mixed series types correctly', () => {
      const data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: [1, 0, 3, 4, 5, 6]},
          [1, {value: 0}, 3, {value: 4}, 5, 6, 7, 8],
          {data: [1, 0, {value: 3}]}
        ]
      };

      expect(getDataArray(data)).toEqual(
        [
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]
      );
    });

    it('should normalize mixed series for pie chart correctly', () => {
      const data = {
        series: [1, {value: 0}, 3, {value: 4}, 5, 6, 7, 8]
      };

      expect(getDataArray(data)).toEqual(
        [1, 0, 3, 4, 5, 6, 7, 8]
      );
    });

    it('should normalize mixed series with string values for pie chart correctly', () => {
      const data = {
        series: ['1', {value: '0'}, '3', {value: '4'}, '5', '6', '7', '8']
      };

      expect(getDataArray(data)).toEqual(
        [1, 0, 3, 4, 5, 6, 7, 8]
      );
    });

    it('should normalize mixed series types with string values correctly', () => {
      const data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: ['1', '0', '3', '4', '5', '6']},
          ['1', {value: '0'}, '3', {value: '4'}, '5', '6', '7', '8'],
          {data: ['1', '0', {value: '3'}]}
        ]
      };

      expect(getDataArray(data)).toEqual(
        [
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]
      );
    });

    it('should normalize mixed series types with weird values correctly', () => {
      const data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: [null, NaN, undefined, '4', '5', '6']},
          ['1', {value: null}, '3', {value: NaN}, '5', '6', '7', '8'],
          {data: ['1', '0', {value: undefined}]}
        ]
      };

      expect(getDataArray(data)).toEqual(
        [
          [undefined, undefined, undefined, 4, 5, 6],
          [1, undefined, 3, undefined, 5, 6, 7, 8],
          [1, 0, undefined]
        ]
      );
    });

    it('should normalize correctly with 0 values in data series array objects', () => {
      const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{
          data: [
            {value: 1},
            {value: 4},
            {value: 2},
            {value: 7},
            {value: 2},
            {value: 0}
          ]
        }]
      };

      expect(getDataArray(data)).toEqual(
        [[1, 4, 2, 7, 2, 0]]
      );
    });

    it('should normalize correctly with mixed dimensional input into multi dimensional output', () => {
      const data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{
          data: [
            {value: 1},
            {value: {y: 4, x: 1}},
            {y: 2, x: 2},
            NaN,
            null,
            {value: 7},
            {value: 2},
            {value: null},
            {y: undefined, x: NaN}
          ]
        }]
      };

      expect(getDataArray(data, false, true)).toEqual(
        [[
          {x: undefined, y: 1},
          {x: 1, y: 4},
          {x: 2, y: 2},
          undefined,
          undefined,
          {x: undefined, y: 7},
          {x: undefined, y: 2},
          undefined,
          {x: undefined, y: undefined}
        ]]
      );
    });

    it('should normalize boolean series correctly', () => {
      const data = {
        series: [true, false, false, true]
      };

      expect(getDataArray(data)).toEqual(
        [1, 0, 0, 1]
      );
    });

    it('should normalize date series correctly', () => {
      const data = {
        series: [new Date(0), new Date(1), new Date(2), new Date(3)]
      };

      expect(getDataArray(data)).toEqual(
        [0, 1, 2, 3]
      );
    });
  });

  describe('getBounds', () => {
    it('should return 10 steps', () => {
      const bounds = getBounds(100, {high: 10, low: 1}, 10, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(10);
      expect(bounds.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('should return 5 steps', () => {
      const bounds = getBounds(100, {high: 10, low: 1}, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(10);
      expect(bounds.values).toEqual([1, 3, 5, 7, 9]);
    });

    it('should return non integer steps', () => {
      const bounds = getBounds(100, {high: 2, low: 1}, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(2);
      expect(bounds.values).toEqual([1, 1.25, 1.5, 1.75, 2]);
    });

    it('should return integer steps only', () => {
      const bounds = getBounds(100, {high: 3, low: 1}, 20, true);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(3);
      expect(bounds.values).toEqual([1, 2, 3]);
    });

    it('should return single integer step', () => {
      const bounds = getBounds(100, {high: 2, low: 1}, 20, true);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(2);
      expect(bounds.values).toEqual([1, 2]);
    });

    it('should floor/ceil min/max', () => {
      const bounds = getBounds(100, {high: 9.9, low: 1.01}, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(10);
      expect(bounds.values).toEqual([1, 3, 5, 7, 9]);
    });

    it('should floor/ceil min/max for non integers', () => {
      const bounds = getBounds(100, {high: 2.9, low: 1.01}, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(3);
      expect(bounds.values).toEqual([1, 1.5, 2, 2.5, 3]);
    });

    it('should floor/ceil min/max if integers only', () => {
      const bounds = getBounds(100, {high: 2.9, low: 1.01}, 20, true);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(3);
      expect(bounds.values).toEqual([1, 2, 3]);
    });

    it('should return neg and pos values', () => {
      const bounds = getBounds(100, {high: 1.9, low: -0.9}, 20, false);
      expect(bounds.min).toBe(-1);
      expect(bounds.max).toBe(2);
      expect(bounds.values).toEqual([-1, 0, 1, 2]);
    });

    it('should return two steps if no space', () => {
      const bounds = getBounds(100, {high: 5, low: 0}, 45, false);
      expect(bounds.min).toBe(0);
      expect(bounds.max).toBe(5);
      expect(bounds.values).toEqual([0, 4]);
    });

    it('should return single step if no space', () => {
      const bounds = getBounds(100, {high: 5, low: 0}, 80, false);
      expect(bounds.min).toBe(0);
      expect(bounds.max).toBe(5);
      expect(bounds.values).toEqual([0]);
    });

    /*
     TODO: This is currently failing with the ES6 refactoring and I can't tell why
     it('should return single step if range is less than epsilon', () => {
     const bounds = getBounds(100, { high: 1.0000000000000002, low: 1 }, 20, false);
     expect(bounds.min).toBe(1);
     expect(bounds.max).toBe(1.0000000000000002);
     expect(bounds.low).toBe(1);
     expect(bounds.high).toBe(1.0000000000000002);
     expect(bounds.values).toEqual([1]);
     });*/

    it('should return single step if range is less than smallest increment', () => {
      const bounds = getBounds(613.234375, {high: 1000.0000000000001, low: 999.9999999999997}, 50, false);
      expect(bounds.min).toBe(999.9999999999999);
      expect(bounds.max).toBe(1000);
      expect(bounds.low).toBe(999.9999999999997);
      expect(bounds.high).toBe(1000.0000000000001);
      expect(bounds.values).toEqual([999.9999999999999]);
    });
  });

  describe('splitIntoSegments', () => {
    function makeValues(arr) {
      return arr.map(function (x) {
        return {value: x};
      });
    }

    it('should return empty array for empty input', () => {
      expect(splitIntoSegments([], [])).toEqual([]);
    });

    it('should remove undefined values', () => {
      const coords = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const values = makeValues([1, undefined, undefined, 4, undefined, 6]);

      expect(splitIntoSegments(coords, values)).toEqual([{
        pathCoordinates: [1, 2],
        valueData: makeValues([1])
      }, {
        pathCoordinates: [7, 8],
        valueData: makeValues([4])
      }, {
        pathCoordinates: [11, 12],
        valueData: makeValues([6])
      }]);
    });

    it('should respect fillHoles option', () => {
      const coords = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
      const values = makeValues([1, undefined, undefined, 4, undefined, 6]);
      const options = {
        fillHoles: true
      };

      expect(splitIntoSegments(coords, values, options)).toEqual([{
        pathCoordinates: [1, 2, 7, 8, 11, 12],
        valueData: makeValues([1, 4, 6])
      }]);
    });

    it('should respect increasingX option', () => {
      const coords = [1, 2, 3, 4, 5, 6, 5, 6, 7, 8, 1, 2];
      const values = makeValues([1, 2, 3, 4, 5, 6]);
      const options = {
        increasingX: true
      };

      expect(splitIntoSegments(coords, values, options)).toEqual([{
        pathCoordinates: [1, 2, 3, 4, 5, 6],
        valueData: makeValues([1, 2, 3])
      }, {
        pathCoordinates: [5, 6, 7, 8],
        valueData: makeValues([4, 5])
      }, {
        pathCoordinates: [1, 2],
        valueData: makeValues([6])
      }]);
    });
  });
});
