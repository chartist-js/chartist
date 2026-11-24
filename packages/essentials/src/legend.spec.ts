import {
  autoScaleAxis,
  axisLabels,
  bar,
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
  type MeasureText,
  type SceneNode
} from 'chartist';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { applyStyles, renderToString } from 'chartist/server';
import { axisTitle } from './axisTitle.ts';
import { legend } from './legend.ts';

const data = {
  labels: ['Mon', 'Tue', 'Wed'],
  series: [
    { name: 'Tea', data: [5, 6, 4] },
    { name: 'Coffee', data: [8, 9, 7] }
  ]
};

/** Every text is 10 px per character and one 16 px line of 12 px type. */
const fixed: MeasureText = text => ({
  width: text.length * 10,
  height: 16,
  fontSize: 12
});

/** The scene, the drawing area and the legend entries of a chart. */
function draw(
  config: ChartConfig,
  size: { width?: number; measureText?: MeasureText } = {}
) {
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
    { width: 400, height: 300, measureText: fixed, ...size }
  );
  return {
    scene,
    area: area!,
    items: findAll(scene, { role: 'legendItem' })
  };
}

const lineWith = (...layers: ReturnType<typeof legend>[]) =>
  lineChartConfig(data, { layers: { above: layers } });

type Items = ReturnType<typeof draw>['items'];

const names = (items: Items) => items.map(item => item.ctx.name);
const marker = (item: SceneNode) => item.children[0];
const label = (item: SceneNode) => item.children[1];

/** A composed chart: EUR bars on the left axis, a USD line on the right. */
function composed(...layers: ReturnType<typeof legend>[]): ChartConfig {
  return {
    data: {
      labels: ['Jan', 'Feb', 'Mar'],
      series: [
        { name: 'EUR', data: [1, 2, 3] },
        { name: 'USD', data: [10, 20, 30] }
      ]
    },
    axes: cartesianAxes([
      { id: 'month', side: 'bottom', type: stepAxis() },
      { id: 'eur', side: 'left', type: autoScaleAxis() },
      { id: 'usd', side: 'right', type: autoScaleAxis() }
    ]),
    layers: [
      bar({ series: ['EUR'], y: 'eur' }),
      line({ series: ['USD'], y: 'usd' }),
      axisLabels(),
      ...layers
    ]
  };
}

describe('legend', () => {
  it('draws an entry with a marker and the name of each series', () => {
    const roles: string[] = [];
    const { scene, items } = draw({
      ...lineWith(legend()),
      on: {
        compose: current => {
          roles.push(String(current.role));
        }
      }
    });
    const [group] = scene.children.filter(child =>
      child.classes.includes('ct-legend')
    );
    expect(group.classes).toEqual(['ct-legend', 'ct-horizontal', 'ct-start']);
    expect(group.children).toEqual(items);
    expect(names(items)).toEqual(['Tea', 'Coffee']);
    expect(items.map(item => item.classes)).toEqual([
      ['ct-legend-item', 'ct-series-a'],
      ['ct-legend-item', 'ct-series-b']
    ]);
    expect(marker(items[0]).name).toBe('circle');
    expect(marker(items[0]).classes).toEqual(['ct-legend-marker']);
    expect(label(items[0]).name).toBe('text');
    expect(label(items[0]).classes).toEqual(['ct-legend-label']);
    expect(label(items[0]).content).toBe('Tea');
    expect(items[1].ctx).toMatchObject({
      seriesIndex: 1,
      name: 'Coffee',
      side: 'top',
      series: { name: 'Coffee', data: [8, 9, 7] }
    });
    expect(items.map(item => item.key)).toEqual(['2/0', '2/1']);
    expect(roles).toContain('legendItem');
    // Geometry is attributes; colors and sizes are left to the stylesheet.
    for (const node of [items[0], marker(items[0]), label(items[0])]) {
      expect(node.attrs).not.toHaveProperty('style');
      expect(node.attrs).not.toHaveProperty('fill');
    }
  });

  it("uses a series' className like the layers that draw it", () => {
    const { items } = draw(
      lineChartConfig(
        {
          labels: ['a', 'b'],
          series: [
            { name: 'Sales', className: 'sales', data: [1, 2] },
            { name: 'Costs', data: [2, 1] }
          ]
        },
        { layers: { above: [legend()] } }
      )
    );
    expect(items.map(item => item.classes)).toEqual([
      ['ct-legend-item', 'sales'],
      ['ct-legend-item', 'ct-series-b']
    ]);
  });

  it('leaves out series without a name, and they keep their color', () => {
    const { items } = draw(
      lineChartConfig(
        {
          labels: ['a', 'b'],
          series: [[1, 2], { name: 'Named', data: [2, 1] }, { data: [3, 3] }]
        },
        { layers: { above: [legend()] } }
      )
    );
    expect(names(items)).toEqual(['Named']);
    expect(items[0].classes).toContain('ct-series-b');
  });

  it('draws nothing and takes no room without names', () => {
    const plain = draw(lineChartConfig({ series: [[1, 2]] }));
    const unnamed = draw(
      lineChartConfig({ series: [[1, 2]] }, { layers: { above: [legend()] } })
    );
    expect(unnamed.items).toEqual([]);
    expect(unnamed.area).toEqual(plain.area);
    expect(
      unnamed.scene.children.some(child => child.classes.includes('ct-legend'))
    ).toBe(false);
  });

  it('lists the series it selects, by index or name, in the chart’s order', () => {
    const three = {
      labels: ['a'],
      series: [
        { name: 'Tea', data: [1] },
        { name: 'Coffee', data: [2] },
        { name: 'Cocoa', data: [3] }
      ]
    };
    const { items } = draw(
      lineChartConfig(three, {
        layers: { above: [legend({ series: ['Cocoa', 0] })] }
      })
    );
    expect(names(items)).toEqual(['Tea', 'Cocoa']);
    expect(items[1].classes).toContain('ct-series-c');
  });

  it('names the values of a pie chart by their labels', () => {
    const { items } = draw(
      pieChartConfig(
        {
          labels: ['Search', 'Direct', 'Social'],
          series: [5, { value: 3, name: 'Typed', className: 'typed' }, 4]
        },
        { layers: { above: [legend({ side: 'right' })] } }
      )
    );
    expect(names(items)).toEqual(['Search', 'Typed', 'Social']);
    expect(items.map(item => item.classes[1])).toEqual([
      'ct-series-a',
      'typed',
      'ct-series-c'
    ]);
    expect(items[1].ctx.series).toEqual({
      value: 3,
      name: 'Typed',
      className: 'typed'
    });
  });

  it('reserves its rows and the gap on top, above the drawing area', () => {
    const plain = draw(lineChartConfig(data));
    const { area, items } = draw(lineWith(legend()));
    // One row of 16 px and the 8 px gap.
    expect(area.y2 - plain.area.y2).toBe(24);
    const tea = marker(items[0]).attrs;
    // The row starts at the top padding (15), its middle 8 px below.
    expect(tea.cy).toBe(15 + 8);
    expect(Number(label(items[0]).attrs.y)).toBeCloseTo(23 + 0.35 * 12);
    expect(draw(lineWith(legend({ gap: 2 }))).area.y2 - plain.area.y2).toBe(18);
  });

  it('centers a row by default and aligns it to the start or end', () => {
    // An entry is 0.8 em marker, 0.4 em space and its name: 14.4 + 30 and
    // 14.4 + 60 px; 15 px between them.
    const width = 44.4 + 15 + 74.4;
    const at = (align?: 'start' | 'middle' | 'end') => {
      const { area, items } = draw(lineWith(legend({ align })));
      const left = Number(marker(items[0]).attrs.cx) - 4.8;
      return { area, left };
    };
    const middle = at();
    expect(middle.left).toBeCloseTo(
      (middle.area.x1 + middle.area.x2 - width) / 2
    );
    expect(at('start').left).toBeCloseTo(at('start').area.x1);
    expect(at('end').left).toBeCloseTo(at('end').area.x2 - width);
    const { items } = draw(lineWith(legend({ align: 'start' })));
    // The name starts after the marker and the space.
    expect(Number(label(items[1]).attrs.x)).toBeCloseTo(
      Number(marker(items[1]).attrs.cx) - 4.8 + 14.4
    );
    expect(label(items[1]).attrs['text-anchor']).toBe('start');
  });

  it('wraps the entries into rows as wide as the area', () => {
    const many = {
      labels: ['a'],
      series: ['One', 'Two', 'Three', 'Four', 'Five', 'Six'].map(name => ({
        name,
        data: [1]
      }))
    };
    const wide = draw(
      lineChartConfig(many, { layers: { above: [legend()] } }),
      { width: 800 }
    );
    const narrow = draw(
      lineChartConfig(many, { layers: { above: [legend()] } }),
      { width: 200 }
    );
    const rowsOf = (items: Items) =>
      new Set(items.map(item => marker(item).attrs.cy)).size;
    expect(rowsOf(wide.items)).toBe(1);
    const rows = rowsOf(narrow.items);
    expect(rows).toBeGreaterThan(1);
    const plain = draw(lineChartConfig(many), { width: 200 });
    expect(narrow.area.y2 - plain.area.y2).toBe(rows * 16 + 8);
    // No row is wider than the area.
    for (const item of narrow.items) {
      expect(
        Number(label(item).attrs.x) + item.ctx.name.length * 10
      ).toBeLessThanOrEqual(narrow.area.x2 + 1e-9);
      expect(Number(marker(item).attrs.cx) - 4.8).toBeGreaterThanOrEqual(
        narrow.area.x1 - 1e-9
      );
    }
  });

  it('keeps to the rows it reserved when other layers narrow the area', () => {
    const many = {
      labels: ['a'],
      series: ['One', 'Two', 'Three', 'Four'].map(name => ({
        name,
        data: [1]
      }))
    };
    // One row needs 4 × 14.4 + 30 + 30 + 50 + 40 + 3 × 15 = 252.6 px; the
    // area is 400 − 25 − 40 = 335 px wide, until a Y title takes 20 px
    // and a 100 px wide right legend more.
    const { items, area } = draw(
      lineChartConfig(many, {
        layers: {
          above: [
            legend({ side: 'bottom' }),
            axisTitle({ axis: 'y', text: 'Cups' }),
            legend({ side: 'right' })
          ]
        }
      })
    );
    expect(area.width).toBeLessThan(252.6);
    const bottom = items.filter(item => item.ctx.side === 'bottom');
    expect(new Set(bottom.map(item => marker(item).attrs.cy)).size).toBe(1);
    expect(Number(marker(bottom[0]).attrs.cy) + 8).toBeLessThanOrEqual(300);
  });

  it('widens its rows to a width they fit with fractional text widths', () => {
    // Widths that sum to a slightly different number in another order: the
    // rows must still settle on the room the bottom legend reserved.
    const widths: Record<string, number> = {
      A: 21.638048371131553,
      B: 10.678973608035117,
      C: 21.509430246199216,
      D: 68.99414787022124
    };
    const measureText: MeasureText = text => ({
      width: widths[text] ?? text.length * 7.3,
      height: 16,
      fontSize: 12
    });
    const { items } = draw(
      lineChartConfig(
        {
          labels: ['a'],
          series: Object.keys(widths).map(name => ({ name, data: [1] }))
        },
        {
          layers: {
            above: [
              legend({ side: 'bottom' }),
              axisTitle({ axis: 'y', text: 'Cups' }),
              legend({ side: 'right' })
            ]
          }
        }
      ),
      { width: 308, measureText }
    );
    const bottom = items.filter(item => item.ctx.side === 'bottom');
    expect(names(bottom)).toEqual(['A', 'B', 'C', 'D']);
    expect(new Set(bottom.map(item => marker(item).attrs.cy)).size).toBe(1);
  });

  it('stands in a column on the left and right, beside the axis labels', () => {
    const plain = draw(lineChartConfig(data));
    const right = draw(lineWith(legend({ side: 'right' })));
    // The widest entry, Coffee, and the gap.
    expect(plain.area.x2 - right.area.x2).toBeCloseTo(14.4 + 60 + 8);
    const [tea, coffee] = right.items.map(item => marker(item).attrs);
    expect(tea.cx).toBe(coffee.cx);
    expect(Number(coffee.cy) - Number(tea.cy)).toBe(16);
    // Centered on the area by default, the gap away from the area.
    expect((Number(tea.cy) + Number(coffee.cy)) / 2).toBeCloseTo(
      (right.area.y1 + right.area.y2) / 2
    );
    expect(Number(tea.cx) - 4.8).toBeCloseTo(right.area.x2 + 8);
    const left = draw(lineWith(legend({ side: 'left', align: 'start' })));
    const first = marker(left.items[0]).attrs;
    // Left of the Y axis band (40 px), at the top of the area.
    expect(Number(first.cy) - 8).toBeCloseTo(left.area.y2);
    expect(Number(first.cx) - 4.8).toBeCloseTo(left.area.x1 - 40 - 8 - 74.4);
    expect(
      draw(lineWith(legend({ side: 'left', align: 'end' }))).items.map(
        item => Number(marker(item).attrs.cy) + 8
      )
    ).toEqual([
      expect.closeTo(left.area.y1 - 16),
      expect.closeTo(left.area.y1)
    ]);
  });

  it('stacks outward with axis titles in the order of layers', () => {
    const { items, scene } = draw(
      lineWith(
        axisTitle({ axis: 'x', text: 'Day' }) as ReturnType<typeof legend>,
        legend({ side: 'bottom' })
      )
    );
    const [title] = findAll(scene, { role: 'axisTitle' });
    expect(Number(marker(items[0]).attrs.cy)).toBeGreaterThan(
      Number(title.attrs.y)
    );
  });

  it('grows with the measured font', () => {
    const { items } = draw(lineWith(legend({ side: 'right' })), {
      measureText: text => ({
        width: text.length * 20,
        height: 30,
        fontSize: 25
      })
    });
    expect(marker(items[0]).attrs.r).toBeCloseTo(10);
    expect(
      Number(marker(items[1]).attrs.cy) - Number(marker(items[0]).attrs.cy)
    ).toBe(30);
  });

  it('lists every series of a composed chart without changing its axes', () => {
    // The labels of the left (EUR) or right (USD) axis.
    const labelsOf = (scene: SceneNode, side: 'ct-start' | 'ct-end') =>
      findAll(scene, { role: 'label' })
        .filter(
          node =>
            node.classes.includes('ct-vertical') && node.classes.includes(side)
        )
        .map(node => node.content ?? node.children[0]?.content);
    const plain = draw(composed());
    const { items, scene } = draw(composed(legend({ side: 'bottom' })));
    expect(names(items)).toEqual(['EUR', 'USD']);
    expect(labelsOf(plain.scene, 'ct-start')).toContain('3');
    expect(labelsOf(scene, 'ct-start')).toEqual(
      labelsOf(plain.scene, 'ct-start')
    );
    expect(labelsOf(scene, 'ct-end')).toEqual(labelsOf(plain.scene, 'ct-end'));
  });

  it('throws for options it doesn’t know', () => {
    expect(() => legend({ side: 'center' as 'top' })).toThrow(
      'Chartist: layer "legend" got "center" for side'
    );
    expect(() => legend({ align: 'left' as 'start' })).toThrow('for align');
    expect(() => legend({ gap: -1 })).toThrow('for gap');
    expect(() => legend({ gap: Number.NaN })).toThrow('for gap');
  });

  it('works on bar charts and replaces its classes', () => {
    const { scene, items } = draw(
      barChartConfig(data, {
        horizontalBars: true,
        layers: {
          above: [
            legend({
              side: 'right',
              classNames: {
                legend: 'key',
                item: 'entry',
                marker: 'dot',
                label: 'name'
              }
            })
          ]
        }
      })
    );
    const group = scene.children.find(child => child.classes.includes('key'))!;
    expect(group.classes).toEqual(['key', 'ct-vertical', 'ct-end']);
    expect(items[0].classes).toEqual(['entry', 'ct-series-a']);
    expect(marker(items[0]).classes).toEqual(['dot']);
    expect(label(items[0]).classes).toEqual(['name']);
  });

  it('escapes the names in string output', () => {
    const markup = renderToString(
      toScene(
        lineChartConfig(
          { series: [{ name: '<b>A & B</b>', data: [1, 2] }] },
          { layers: { above: [legend()] } }
        ),
        { width: 400, height: 300 }
      )
    );
    expect(markup).toContain('&lt;b&gt;A &amp; B&lt;/b&gt;');
    expect(markup).not.toContain('<b>');
  });

  it('gets its colors and size from the stylesheets in both color schemes', () => {
    const require = createRequire(import.meta.url);
    const css = [
      readFileSync(require.resolve('chartist/styles.css'), 'utf8'),
      readFileSync(new URL('styles.css', import.meta.url), 'utf8')
    ];
    const scene = toScene(lineWith(legend()), { width: 400, height: 300 });
    const styled = (colorScheme: 'light' | 'dark') =>
      findAll(applyStyles(scene, css, { colorScheme }), {
        role: 'legendItem'
      });
    const light = styled('light');
    const dark = styled('dark');
    // Each marker in its series' color, as the lines are.
    const lines = findAll(applyStyles(scene, css), { role: 'line' });
    expect(light.map(item => marker(item).attrs.fill)).toEqual(
      lines.map(node => node.attrs.stroke)
    );
    expect(marker(light[0]).attrs.fill).toBe('#d70206');
    // The names like the axis labels.
    const axisLabel = findAll(applyStyles(scene, css), { role: 'label' })[0]
      .attrs;
    expect(label(light[0]).attrs.fill).toBe(axisLabel.fill);
    expect(label(light[0]).attrs['font-size']).toBe(axisLabel['font-size']);
    expect(label(dark[0]).attrs.fill).not.toBe(label(light[0]).attrs.fill);
    // In their series' color, when the page says so.
    const page =
      '.ct-legend-label { --ct-legend-label-color: var(--ct-color); }';
    const colored = findAll(applyStyles(scene, [...css, page]), {
      role: 'legendItem'
    });
    expect(label(colored[1]).attrs.fill).toBe('#f05b4f');
  });
});
