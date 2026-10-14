import { BarChart } from '../charts/BarChart/BarChart';
import { LineChart } from '../charts/LineChart/LineChart';
import { PieChart } from '../charts/PieChart/PieChart';
import { Bar, Line, Pie, getDataArray, plugins } from './umd';

describe('compat UMD entry: the 0.x names', () => {
  it('names the 1.x classes as 0.x did', () => {
    expect(Line).toBe(LineChart);
    expect(Bar).toBe(BarChart);
    expect(Pie).toBe(PieChart);
  });

  it('has a plugins object to register on', () => {
    expect(plugins).toEqual(expect.any(Object));
  });
});

describe('getDataArray', () => {
  it('gives the values of each series as numbers', () => {
    expect(
      getDataArray({
        labels: ['a', 'b', 'c'],
        series: [
          [1, '2', null],
          { name: 'B', data: [{ value: 4 }, { value: 5, meta: 'x' }, 6] }
        ]
      })
    ).toEqual([
      [1, 2, undefined],
      [4, 5, 6]
    ]);
  });

  it('pads shorter series to the longest, as the 1.x charts do', () => {
    expect(getDataArray({ series: [[1, 2, 3], [4]] })).toEqual([
      [1, 2, 3],
      [4, undefined, undefined]
    ]);
  });

  it('reverses the series and their values with reverse', () => {
    expect(
      getDataArray(
        {
          series: [
            [1, 2],
            [3, 4]
          ]
        },
        true
      )
    ).toEqual([
      [4, 3],
      [2, 1]
    ]);
  });

  it('gives pie data as one array', () => {
    expect(getDataArray({ series: [10, { value: 20 }, '30'] })).toEqual([
      10, 20, 30
    ]);
  });

  it('leaves the data unchanged', () => {
    const data = {
      series: [
        [1, 2],
        [3, 4]
      ]
    };
    getDataArray(data, true);
    expect(data.series).toEqual([
      [1, 2],
      [3, 4]
    ]);
  });
});
