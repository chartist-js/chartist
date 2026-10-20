import {
  autoScaleAxis,
  axisLabels,
  barChartConfig,
  cartesianAxes,
  findAll,
  line,
  lineChartConfig,
  pieChartConfig,
  stepAxis,
  toScene,
  type Area,
  type ChartConfig,
  type MeasureText
} from 'chartist';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { applyStyles, renderToString } from 'chartist/server';
import { axisTitle } from './axisTitle.ts';

const data = { labels: ['Mon', 'Tue', 'Wed'], series: [[12, 9, 7]] };

/** Every text is one 16 px line of 12 px type. */
const fixed: MeasureText = () => ({ width: 40, height: 16, fontSize: 12 });

/** The scene, the drawing area and the titles of a chart. */
function draw(config: ChartConfig, measureText: MeasureText = fixed) {
  let area: Area | undefined;
  const scene = toScene(
    {
      ...config,
      on: {
        ...config.on,
        layout: current => {
          area = current.area;
        }
      }
    },
    { width: 400, height: 300, measureText }
  );
  return { scene, area: area!, titles: findAll(scene, { role: 'axisTitle' }) };
}

const lineWith = (...titles: ReturnType<typeof axisTitle>[]) =>
  lineChartConfig(data, { layers: { above: titles } });

/** A composed chart: months at the bottom, EUR on the left, USD on the right. */
function composed(...titles: ReturnType<typeof axisTitle>[]) {
  return {
    data: {
      labels: data.labels,
      series: [
        [1, 2, 3],
        [30, 20, 10]
      ]
    },
    axes: cartesianAxes([
      { id: 'month', side: 'bottom', type: stepAxis(), offset: 30 },
      { id: 'eur', side: 'left', type: autoScaleAxis(), offset: 40 },
      { id: 'usd', side: 'right', type: autoScaleAxis(), offset: 50 }
    ]),
    layers: [
      line({ series: [0], x: 'month', y: 'eur' }),
      line({ series: [1], x: 'month', y: 'usd' }),
      axisLabels(),
      ...titles
    ]
  } satisfies ChartConfig;
}

describe('axisTitle', () => {
  it('draws one text with the classes, role and context of its axis', () => {
    const roles: string[] = [];
    const { titles } = draw({
      ...lineWith(axisTitle({ axis: 'y', text: 'Visits' })),
      on: {
        compose: current => {
          roles.push(String(current.role));
        }
      }
    });
    expect(titles).toHaveLength(1);
    const [title] = titles;
    expect(title.name).toBe('text');
    expect(title.classes).toEqual(['ct-axis-title', 'ct-vertical', 'ct-start']);
    expect(title.content).toBe('Visits');
    expect(title.ctx).toMatchObject({
      axis: 'y',
      side: 'left',
      text: 'Visits'
    });
    expect(roles).toContain('axisTitle');
  });

  it('takes extra classes and a replacement for its own', () => {
    const [title] = draw(
      lineWith(
        axisTitle({
          axis: 'x',
          text: 'Day',
          className: 'ct-series-b',
          classNames: { title: 'title' }
        })
      )
    ).titles;
    expect(title.classes).toEqual([
      'title',
      'ct-horizontal',
      'ct-end',
      'ct-series-b'
    ]);
  });

  it('throws for an unknown axis and in polar charts', () => {
    expect(() =>
      draw(lineWith(axisTitle({ axis: 'eur', text: 'EUR' })))
    ).toThrow('Chartist: unknown axis "eur" in layer "axisTitle"');
    expect(() =>
      draw(
        pieChartConfig(
          { series: [1, 2] },
          { layers: { above: [axisTitle({ axis: 'x', text: 'Nope' })] } }
        )
      )
    ).toThrow('does not support polar coordinates');
  });

  it('draws nothing and takes no room without text', () => {
    const plain = draw(lineChartConfig(data));
    const empty = draw(lineWith(axisTitle({ axis: 'x', text: '' })));
    expect(empty.titles).toEqual([]);
    expect(empty.area).toEqual(plain.area);
  });

  it('reserves one measured line plus the gap next to its axis', () => {
    const plain = draw(lineChartConfig(data));
    const titled = draw(lineWith(axisTitle({ axis: 'x', text: 'Day' })));
    expect(plain.area.y1 - titled.area.y1).toBe(16 + 4);
    // Below the X labels, inside the chart.
    const labelYs = findAll(titled.scene, { role: 'label' })
      .filter(label => label.classes.includes('ct-horizontal'))
      .map(label => Number(label.attrs.y));
    const y = Number(titled.titles[0].attrs.y);
    expect(y).toBeGreaterThan(Math.max(...labelYs));
    expect(y).toBeLessThanOrEqual(300);
    expect(
      draw(lineWith(axisTitle({ axis: 'x', text: 'Day', gap: 10 }))).area.y1
    ).toBe(plain.area.y1 - 26);
  });

  it('grows with the measured font', () => {
    const plain = draw(lineChartConfig(data));
    const large = draw(lineWith(axisTitle({ axis: 'x', text: 'Day' })), () => ({
      width: 60,
      height: 30,
      fontSize: 25
    }));
    expect(plain.area.y1 - large.area.y1).toBe(34);
  });

  it('centers an X title under the area, its baseline in its line', () => {
    const { titles, area } = draw(
      lineWith(axisTitle({ axis: 'x', text: 'Day' }))
    );
    expect(titles[0].attrs).toMatchObject({
      x: (area.x1 + area.x2) / 2,
      'text-anchor': 'middle'
    });
    // The line starts gap px below the axis band (offset 30 in the preset).
    expect(titles[0].attrs.y).toBeCloseTo(area.y1 + 30 + 4 + 0.85 * 12);
    expect(titles[0].attrs.transform).toBeUndefined();
  });

  it('aligns along the axis and reads Y titles from bottom to top', () => {
    const { titles, area } = draw(
      lineWith(
        axisTitle({ axis: 'x', text: 'Day', align: 'start' }),
        axisTitle({ axis: 'y', text: 'Visits', align: 'end' })
      )
    );
    const [x, y] = titles;
    expect(x.attrs).toMatchObject({ x: area.x1, 'text-anchor': 'start' });
    expect(y.attrs).toMatchObject({ y: area.y2, 'text-anchor': 'end' });
    expect(y.attrs.transform).toBe(`rotate(-90 ${y.attrs.x} ${y.attrs.y})`);
  });

  it('flips a right title to read from top to bottom, right of its labels', () => {
    const { titles, area } = draw(
      composed(
        axisTitle({ axis: 'usd', text: 'USD', flip: true, align: 'start' })
      )
    );
    const [usd] = titles;
    expect(usd.attrs.transform).toBe(
      `rotate(90 ${usd.attrs.x} ${usd.attrs.y})`
    );
    // Reading downward, the start (the bottom) is where the text ends.
    expect(usd.attrs).toMatchObject({ y: area.y1, 'text-anchor': 'end' });
    expect(Number(usd.attrs.x)).toBeGreaterThan(area.x2 + 50);
    expect(Number(usd.attrs.x)).toBeLessThanOrEqual(400);
  });

  it('flip leaves X titles as they are', () => {
    const plain = draw(lineWith(axisTitle({ axis: 'x', text: 'Day' })))
      .titles[0];
    const flipped = draw(
      lineWith(axisTitle({ axis: 'x', text: 'Day', flip: true }))
    ).titles[0];
    expect(flipped.attrs).toEqual(plain.attrs);
  });

  it('puts every title outside the axis bands of its side', () => {
    const { titles, area } = draw(
      composed(
        axisTitle({ axis: 'month', text: 'Month' }),
        axisTitle({ axis: 'eur', text: 'EUR' }),
        axisTitle({ axis: 'usd', text: 'USD' })
      )
    );
    const [month, eur, usd] = titles.map(title => title.attrs);
    expect(Number(month.y)).toBeGreaterThan(area.y1 + 30);
    expect(Number(eur.x)).toBeLessThan(area.x1 - 40);
    expect(Number(usd.x)).toBeGreaterThan(area.x2 + 50);
    expect(titles.map(title => title.ctx.side)).toEqual([
      'bottom',
      'left',
      'right'
    ]);
  });

  it('stacks titles of one side outward in layer order', () => {
    const config: ChartConfig = {
      data: {
        series: [
          [1, 2],
          [3, 4]
        ]
      },
      axes: cartesianAxes([
        { id: 'x', side: 'bottom', type: stepAxis() },
        { id: 'eur', side: 'left', type: autoScaleAxis(), offset: 40 },
        { id: 'usd', side: 'left', type: autoScaleAxis(), offset: 40 }
      ]),
      layers: [
        line({ series: [0], y: 'eur' }),
        line({ series: [1], y: 'usd' }),
        axisTitle({ axis: 'eur', text: 'EUR' }),
        axisTitle({ axis: 'usd', text: 'USD' })
      ]
    };
    const [eur, usd] = draw(config).titles;
    expect(Number(eur.attrs.x)).toBeGreaterThan(Number(usd.attrs.x));
  });

  it('works on horizontal bars and axes moved with position', () => {
    const [bars] = draw(
      barChartConfig(data, {
        horizontalBars: true,
        layers: { above: [axisTitle({ axis: 'x', text: 'Revenue' })] }
      })
    ).titles;
    expect(bars.ctx.side).toBe('bottom');
    const { titles, area } = draw(
      lineChartConfig(data, {
        axisX: { position: 'start' },
        layers: { above: [axisTitle({ axis: 'x', text: 'Day' })] }
      })
    );
    expect(titles[0].classes).toEqual([
      'ct-axis-title',
      'ct-horizontal',
      'ct-start'
    ]);
    expect(Number(titles[0].attrs.y)).toBeLessThan(area.y2);
  });

  it('escapes its text in string output', () => {
    const markup = renderToString(
      toScene(lineWith(axisTitle({ axis: 'x', text: '<b>A & B</b>' })), {
        width: 400,
        height: 300
      })
    );
    expect(markup).toContain('&lt;b&gt;A &amp; B&lt;/b&gt;');
    expect(markup).not.toContain('<b>');
  });

  it('gets its fill and size from the stylesheets in both color schemes', () => {
    const require = createRequire(import.meta.url);
    const css = [
      readFileSync(require.resolve('chartist/styles.css'), 'utf8'),
      readFileSync(new URL('styles.css', import.meta.url), 'utf8')
    ];
    const scene = toScene(lineWith(axisTitle({ axis: 'x', text: 'Day' })), {
      width: 400,
      height: 300
    });
    const styled = (colorScheme: 'light' | 'dark') =>
      findAll(applyStyles(scene, css, { colorScheme }), {
        role: 'axisTitle'
      })[0].attrs;
    const light = styled('light');
    const dark = styled('dark');
    expect(light.fill).toBeDefined();
    expect(light['font-size']).toBeDefined();
    expect(dark.fill).toBeDefined();
    expect(dark.fill).not.toBe(light.fill);
    // Like the axis labels.
    const label = findAll(applyStyles(scene, css), { role: 'label' })[0].attrs;
    expect(light.fill).toBe(label.fill);
    expect(light['font-size']).toBe(label['font-size']);
  });
});
