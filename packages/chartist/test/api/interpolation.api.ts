import {
  AutoScaleAxis,
  Interpolation,
  LineChart,
  type SegmentData
} from 'chartist';
import { container, created, withCompat } from './fixture.ts';

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
        withCompat({ lineSmooth: Interpolation.step(), showPoint: false })
      )
    );
    const d = el.querySelector('.ct-line')!.getAttribute('d')!;
    expect(d).toMatch(/^M[\d.,]+(L[\d.,]+)+$/);
    expect(d.match(/L/g)).toHaveLength(4);
  });

  // 1.x broke the smoothed line at every point whose x didn't increase,
  // which left only move commands.
  const v1 = process.env.CHARTIST_API_TARGET === 'v1';
  const lineOf = async (
    series: unknown[],
    options: Record<string, unknown> = {}
  ) => {
    const el = container();
    await created(
      new LineChart(
        el,
        { series: [series] } as never,
        withCompat({ axisX: { type: AutoScaleAxis }, ...options })
      )
    );
    return el.querySelector('.ct-line')!.getAttribute('d')!;
  };

  test('smoothed lines connect descending x values (#1038)', async () => {
    const d = await lineOf([
      { x: 3, y: 1 },
      { x: 2, y: 4 },
      { x: 1, y: 2 }
    ]);
    expect(d.match(/M/g)).toHaveLength(v1 ? 3 : 1);
    expect(d.match(/C/g) ?? []).toHaveLength(v1 ? 0 : 2);
  });

  test('smoothed lines stay connected with reverseData on an auto X axis (#1075)', async () => {
    const d = await lineOf(
      [
        { x: 1, y: 1 },
        { x: 2, y: 4 },
        { x: 3, y: 2 },
        { x: 4, y: 3 }
      ],
      { reverseData: true }
    );
    expect(d.match(/M/g)).toHaveLength(v1 ? 4 : 1);
    expect(d.match(/C/g) ?? []).toHaveLength(v1 ? 0 : 3);
  });

  test.each(['step', 'simple'] as const)(
    '{ x, y: null } is a hole with %s (#1040)',
    async name => {
      const d = await lineOf(
        [
          { x: 1, y: 1 },
          { x: 2, y: 3 },
          { x: 3, y: null },
          { x: 4, y: 2 },
          { x: 5, y: 3 }
        ],
        { lineSmooth: Interpolation[name]() }
      );
      // 1.x drew to a NaN y at the hole.
      expect(d.includes('NaN')).toBe(v1);
      if (!v1) {
        expect(d.match(/M/g)).toHaveLength(2);
      }
    }
  );
});
