import { chart, pie, PieChart, pieChart } from 'chartist';
import { container, created, withCompat } from './fixture.ts';

const SIZE = { width: 300, height: 300 };

describe('pieChart (v2 preset)', () => {
  test('renders slices and labels synchronously', () => {
    const el = container();
    pieChart(el, { labels: ['a', 'b', 'c'], series: [1, 2, 3] }, SIZE);
    expect(el.querySelectorAll('path.ct-slice-pie')).toHaveLength(3);
    expect(
      Array.from(el.querySelectorAll('text.ct-label'), t => t.textContent)
    ).toEqual(['a', 'b', 'c']);
  });

  test('a gauge uses the total for the slice angles', () => {
    const el = container();
    pieChart(
      el,
      { series: [50] },
      { ...SIZE, donut: true, total: 200, showLabel: false }
    );
    expect(el.querySelector('svg')!.getAttribute('class')).toBe(
      'ct-chart-donut'
    );
    expect(el.querySelectorAll('text')).toHaveLength(0);
  });
});

describe('composing a pie chart from parts', () => {
  test('chart() with the pie layer in polar coordinates', () => {
    const el = container();
    chart(el, {
      data: { series: [1, 1] },
      coordinates: 'polar',
      layers: [pie({ donut: true, donutWidth: 10 })],
      ...SIZE
    });
    expect(el.querySelectorAll('path.ct-slice-donut')).toHaveLength(2);
  });
});

// chartist@1.5.0 throws on these: it merged the object into the numeric
// default padding.
describe('object chartPadding on a pie (#842)', () => {
  const centres = (el: Element) =>
    Array.from(el.querySelectorAll('path.ct-slice-pie'), path =>
      path
        .getAttribute('d')!
        .match(/L([\d.]+),([\d.]+)Z$/)!
        .slice(1)
        .map(Number)
    );

  test('pieChart() fills the other sides with the pie default', () => {
    const el = container();
    pieChart(el, { series: [1, 2] }, { ...SIZE, chartPadding: { top: 20 } });
    expect(centres(el)).toEqual([
      [150, 157.5],
      [150, 157.5]
    ]);
  });

  test('new PieChart() fills the other sides with the pie default', async () => {
    const el = container();
    await created(
      new PieChart(
        el,
        { series: [1, 2] },
        withCompat({ ...SIZE, chartPadding: { top: 20 } })
      )
    );
    expect(centres(el)).toEqual([
      [150, 157.5],
      [150, 157.5]
    ]);
  });
});

// chartist@1.5.0 draws one arc between points 0.01° apart, whose centre
// moves by up to 6 px once the path is rounded.
describe('a single-value donut (#1302)', () => {
  /** The midpoint of the start and of the first arc's end. */
  const ringCentre = (el: Element) => {
    const d = el.querySelector('path.ct-slice-donut')!.getAttribute('d')!;
    const [x1, y1, x2, y2] = d
      .match(/^M([\d.]+),([\d.]+)A[\d.]+,[\d.]+,0,0,0,([\d.]+),([\d.]+)A/)!
      .slice(1)
      .map(Number);
    return { x: (x1 + x2) / 2, y: (y1 + y2) / 2 };
  };
  const options = { ...SIZE, donut: true, startAngle: 34, showLabel: false };

  test('pieChart() draws the ring around the centre', () => {
    const el = container();
    pieChart(el, { series: [5] }, options);
    const centre = ringCentre(el);
    expect(Math.abs(centre.x - 150)).toBeLessThan(0.01);
    expect(Math.abs(centre.y - 150)).toBeLessThan(0.01);
  });

  test('new PieChart() draws the ring around the centre', async () => {
    const el = container();
    await created(new PieChart(el, { series: [5] }, withCompat(options)));
    const centre = ringCentre(el);
    expect(Math.abs(centre.x - 150)).toBeLessThan(0.01);
    expect(Math.abs(centre.y - 150)).toBeLessThan(0.01);
  });
});
