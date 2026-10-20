import { groupBySeries, step } from './keyboard.ts';

const values = (series: number, count: number) =>
  Array.from({ length: series * count }, (_, index) => ({
    seriesIndex: Math.floor(index / count),
    valueIndex: index % count
  }));

describe('keyboard order', () => {
  const groups = groupBySeries(values(3, 4).reverse());
  const at = (series: number, value: number) =>
    groups[series].find(stop => stop.valueIndex === value)!;

  it('groups by series and sorts by value index', () => {
    expect(groups.map(group => group.map(stop => stop.valueIndex))).toEqual([
      [0, 1, 2, 3],
      [0, 1, 2, 3],
      [0, 1, 2, 3]
    ]);
  });

  it('steps within a series and to the same index in the next one', () => {
    expect(step(groups, at(0, 0), 'ArrowRight')).toBe(at(0, 1));
    expect(step(groups, at(0, 1), 'ArrowDown')).toBe(at(1, 1));
    expect(step(groups, at(1, 1), 'ArrowUp')).toBe(at(0, 1));
    expect(step(groups, at(0, 0), 'ArrowLeft')).toBeUndefined();
    expect(step(groups, at(2, 1), 'ArrowDown')).toBeUndefined();
    expect(step(groups, at(1, 2), 'Home')).toBe(at(1, 0));
    expect(step(groups, at(1, 2), 'End')).toBe(at(1, 3));
  });

  it('goes to the nearest index in a shorter series', () => {
    const uneven = groupBySeries([
      { seriesIndex: 0, valueIndex: 0 },
      { seriesIndex: 0, valueIndex: 5 },
      { seriesIndex: 1, valueIndex: 1 },
      { seriesIndex: 1, valueIndex: 4 }
    ]);
    expect(step(uneven, uneven[0][1], 'ArrowDown')).toBe(uneven[1][1]);
  });

  it('steps across series when each has one value, as slices', () => {
    const slices = groupBySeries(
      [0, 1, 2].map(seriesIndex => ({ seriesIndex, valueIndex: 0 }))
    );
    expect(step(slices, slices[0][0], 'ArrowRight')).toBe(slices[1][0]);
    expect(step(slices, slices[2][0], 'ArrowRight')).toBeUndefined();
    expect(step(slices, slices[1][0], 'End')).toBe(slices[2][0]);
  });
});
