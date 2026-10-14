import { BarChart } from '../charts/BarChart/BarChart';
import { LineChart } from '../charts/LineChart/LineChart';
import { PieChart } from '../charts/PieChart/PieChart';
import { fromLegacyPlugin } from '.';
import { getDataArray, installGlobal } from './global';

const compat = { fromLegacyPlugin };
type Global = Record<string, unknown>;

describe('installGlobal: the global Chartist for plugin scripts', () => {
  it('creates the global with the core, compat and the 0.x names', () => {
    const root: { Chartist?: Global; document: object } = { document: {} };
    installGlobal(compat, root);
    const global = root.Chartist!;
    expect(global.LineChart).toBe(LineChart);
    expect(global.fromLegacyPlugin).toBe(fromLegacyPlugin);
    expect(global.Line).toBe(LineChart);
    expect(global.Bar).toBe(BarChart);
    expect(global.Pie).toBe(PieChart);
    expect(global.getDataArray).toBe(getDataArray);
    expect(global.plugins).toEqual({});
  });

  it('adds only what a global of the same Chartist lacks', () => {
    const registered = { legend: () => undefined };
    const existing: Global = { LineChart, plugins: registered, extend: 'own' };
    const root = { Chartist: existing, document: {} };
    installGlobal(compat, root);
    expect(root.Chartist).toBe(existing);
    expect(existing.plugins).toBe(registered);
    expect(existing.extend).toBe('own');
    expect(existing.Line).toBe(LineChart);
    expect(existing.fromLegacyPlugin).toBe(fromLegacyPlugin);
  });

  it('leaves a global of another Chartist copy alone, with a warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const other: Global = { LineChart: class {} };
    const root = { Chartist: other, document: {} };
    installGlobal(compat, root);
    expect(Object.keys(other)).toEqual(['LineChart']);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('another copy of Chartist')
    );
    warn.mockRestore();
  });

  it('does nothing outside a browser', () => {
    const root: { Chartist?: Global } = {};
    installGlobal(compat, root);
    expect(root.Chartist).toBeUndefined();
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
