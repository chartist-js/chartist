import { Interpolation, LineChart, type SegmentData } from 'chartist';
import { container, created } from './fixture.ts';

const COORDINATES = [0, 10, 10, 0, 20, 10, 30, 5];
const VALUES = [1, 2, 1, 3].map(y => ({ value: { y } })) as SegmentData[];

describe('Interpolation', () => {
  test.each([
    ['none', 'M0,10L10,0L20,10L30,5'],
    ['simple', 'M0,10C5,10,5,0,10,0C15,0,15,10,20,10C25,10,25,5,30,5'],
    ['step', 'M0,10L10,10L10,0L20,0L20,10L30,10L30,5'],
    [
      'cardinal',
      'M0,10C1.667,8.333,6.667,0,10,0C13.333,0,16.667,9.167,20,10C23.333,10.833,28.333,5.833,30,5'
    ],
    [
      'monotoneCubic',
      'M0,10C3.333,6.667,6.667,0,10,0C13.333,0,16.667,10,20,10C23.333,10,26.667,6.667,30,5'
    ]
  ] as const)('%s', (name, expected) => {
    expect(Interpolation[name]()(COORDINATES, VALUES).stringify()).toBe(
      expected
    );
  });

  test('holes split the path, unless fillHoles is set', () => {
    const values = [1, undefined, 1].map(y => ({
      value: { y }
    })) as SegmentData[];
    const coordinates = [0, 10, 10, 0, 20, 10];
    expect(Interpolation.none()(coordinates, values).stringify()).toBe(
      'M0,10M20,10'
    );
    expect(
      Interpolation.none({ fillHoles: true })(coordinates, values).stringify()
    ).toBe('M0,10L20,10');
  });

  test('lineSmooth option selects the interpolation of a LineChart', async () => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [[1, 2, 1]] },
        { lineSmooth: Interpolation.step(), showPoint: false }
      )
    );
    const d = el.querySelector('.ct-line')!.getAttribute('d')!;
    expect(d).toMatch(/^M[\d.,]+(L[\d.,]+)+$/);
    expect(d.match(/L/g)).toHaveLength(4);
  });
});
