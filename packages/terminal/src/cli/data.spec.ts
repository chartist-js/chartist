import { InputError, parseData, parseSeriesArg } from './data.ts';

describe('parseSeriesArg', () => {
  it('reads comma-separated numbers, empty values as holes', () => {
    expect(parseSeriesArg('1,2.5,-3')).toEqual([1, 2.5, -3]);
    expect(parseSeriesArg('2,,4')).toEqual([2, null, 4]);
  });

  it('names what is not a number', () => {
    expect(() => parseSeriesArg('1,two,3')).toThrow(
      new InputError('"two" is not a number.')
    );
  });
});

describe('parseData', () => {
  it('reads JSON objects and arrays', () => {
    expect(parseData('{"labels":["A","B"],"series":[3,2]}')).toEqual({
      labels: ['A', 'B'],
      series: [3, 2]
    });
    expect(parseData('[[1,2],[3,4]]')).toEqual({
      series: [
        [1, 2],
        [3, 4]
      ]
    });
    expect(parseData('[1,2,3]')).toEqual({ series: [[1, 2, 3]] });
  });

  it('explains bad JSON', () => {
    expect(() => parseData('{"series": [1,')).toThrow("isn't valid JSON");
    expect(() => parseData('{"values": [1]}')).toThrow(
      'needs a "series" array'
    );
  });

  it('reads rows of values, one series per row', () => {
    expect(parseData('1 2 3\n4 5 6\n')).toEqual({
      labels: undefined,
      series: [
        [1, 2, 3],
        [4, 5, 6]
      ]
    });
    expect(parseData('1;2\n3;4')).toEqual({
      labels: undefined,
      series: [
        [1, 2],
        [3, 4]
      ]
    });
    expect(parseData('1\t\t3')).toEqual({
      labels: undefined,
      series: [[1, null, 3]]
    });
  });

  it('reads labels from a header row and names from the first column', () => {
    expect(parseData(',Mon,Tue\nVisitors,3,5\nSign-ups,1,2')).toEqual({
      labels: ['Mon', 'Tue'],
      series: [
        { name: 'Visitors', data: [3, 5] },
        { name: 'Sign-ups', data: [1, 2] }
      ]
    });
    expect(parseData('Mon,Tue\n3,5')).toEqual({
      labels: ['Mon', 'Tue'],
      series: [[3, 5]]
    });
    expect(parseData('Visitors,3,5\nSign-ups,1,2')).toEqual({
      labels: undefined,
      series: [
        { name: 'Visitors', data: [3, 5] },
        { name: 'Sign-ups', data: [1, 2] }
      ]
    });
  });

  it('names a value that is not a number', () => {
    expect(() => parseData('1,2\n3,x')).toThrow('"x" is not a number.');
  });

  it('rejects empty input', () => {
    expect(() => parseData(' \n')).toThrow('No data');
  });
});
