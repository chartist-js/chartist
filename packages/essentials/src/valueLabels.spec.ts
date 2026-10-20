// @vitest-environment node
import {
  autoScaleAxis,
  bar,
  barChartConfig,
  cartesianAxes,
  findAll,
  line,
  lineChartConfig,
  pieChartConfig,
  stepAxis,
  textAscent,
  toScene,
  type Area,
  type ChartConfig,
  type Layer,
  type MeasureText,
  type SceneNode
} from 'chartist';
import { renderToString } from 'chartist/server';
import { valueLabels, type ValueLabelsOptions } from './valueLabels.ts';

/** Every character 6 px wide, every line 14 px high, in 12 px type. */
const fixed: MeasureText = text => ({
  width: 6 * text.length,
  height: 14,
  fontSize: 12
});
const SIZE = { width: 400, height: 300, measureText: fixed };

/** The scene of a chart, its drawing area and its padding. */
function draw(config: ChartConfig) {
  let area: Area | undefined;
  const probe: Layer = {
    type: 'probe',
    coordinates: ['cartesian'],
    series: [],
    compose: context => {
      area = context.area;
      return [];
    }
  };
  const scene = toScene(
    { ...config, layers: [...(config.layers ?? []), probe] },
    SIZE
  );
  return { scene, area: area! };
}

const labelsOf = (scene: SceneNode) => findAll(scene, { role: 'valueLabel' });
const textOf = (label: SceneNode) =>
  label.children.length
    ? label.children.map(child => child.content ?? '').join('\n')
    : (label.content ?? '');
const texts = (scene: SceneNode) =>
  labelsOf(scene).map(label => label.ctx.text);

const bars = (
  series: unknown[],
  options: Parameters<typeof barChartConfig>[1] = {},
  labels: ValueLabelsOptions = {}
) =>
  draw(
    barChartConfig(
      {
        labels: series[0] && (series[0] as unknown[]).map((_, i) => `L${i}`),
        series
      } as never,
      { ...options, layers: { above: [valueLabels(labels)] } }
    )
  );

describe('valueLabels', () => {
  describe('the layer', () => {
    it('labels the bars of a bar chart, after them and before the axis labels', () => {
      const { scene } = draw(
        barChartConfig(
          { labels: ['Q1', 'Q2', 'Q3'], series: [[5, 4, 7]] },
          { layers: { above: [valueLabels()] } }
        )
      );
      expect(texts(scene)).toEqual(['5', '4', '7']);
      const markup = renderToString(scene);
      const group = markup.indexOf('class="ct-value-labels"');
      expect(group).toBeGreaterThan(markup.lastIndexOf('class="ct-bar"'));
      expect(group).toBeLessThan(markup.indexOf('class="ct-labels"'));
      expect(markup.match(/<text[^>]*class="ct-value-label/g)).toHaveLength(3);
    });

    it('labels every point of a line chart', () => {
      const { scene } = draw(
        lineChartConfig(
          {
            series: [
              [1, 2, 3, 4],
              [4, 3, 2, 1]
            ]
          },
          { layers: { above: [valueLabels()] } }
        )
      );
      expect(labelsOf(scene)).toHaveLength(8);
    });

    it('labels no bar that a compose listener dropped', () => {
      const { scene } = draw(
        barChartConfig(
          { labels: ['a', 'b', 'c'], series: [[5, 4, 7]] },
          {
            layers: { above: [valueLabels()] },
            on: {
              compose: current =>
                current.role === 'bar' && current.ctx.valueIndex === 1
                  ? null
                  : current
            }
          }
        )
      );
      expect(texts(scene)).toEqual(['5', '7']);
    });

    it('throws on a pie chart', () => {
      expect(() =>
        toScene(
          pieChartConfig({ series: [1, 2] }, {
            layers: { above: [valueLabels()] }
          } as never),
          SIZE
        )
      ).toThrow(/valueLabels.*polar|polar.*valueLabels/);
    });

    it('leaves the axes and the series as they are', () => {
      const data = { labels: ['a', 'b', 'c'], series: [[5, 4, 7]] };
      const plain = draw(barChartConfig(data));
      const labeled = draw(
        barChartConfig(data, { layers: { above: [valueLabels()] } })
      );
      expect(labeled.area).toEqual(plain.area);
      expect(findAll(labeled.scene, { role: 'bar' }).map(b => b.attrs)).toEqual(
        findAll(plain.scene, { role: 'bar' }).map(b => b.attrs)
      );
      expect(findAll(labeled.scene, { role: 'grid' }).length).toBe(
        findAll(plain.scene, { role: 'grid' }).length
      );
    });

    it('throws on unknown options', () => {
      expect(() => valueLabels({ barPosition: 'top' as never })).toThrow(
        /valueLabels.*barPosition/
      );
      expect(() => valueLabels({ pointPosition: 'up' as never })).toThrow(
        /pointPosition/
      );
      expect(() => valueLabels({ overflow: 'hide' as never })).toThrow(
        /overflow/
      );
      expect(() => valueLabels({ offset: NaN })).toThrow(/offset/);
    });
  });

  describe('what it labels', () => {
    const composed = (labels: ValueLabelsOptions) =>
      draw({
        data: {
          labels: ['a', 'b'],
          series: [
            { name: 'revenue', data: [5, 6] },
            { name: 'costs', data: [3, 4] }
          ]
        },
        axes: cartesianAxes([
          { id: 'x', side: 'bottom', type: stepAxis() },
          { id: 'y', side: 'left', type: autoScaleAxis(), low: 0 }
        ]),
        layers: [
          bar({ series: ['revenue'] }),
          line({ series: ['costs'] }),
          valueLabels(labels)
        ]
      }).scene;

    it('labels bars only', () => {
      const labels = labelsOf(composed({ roles: ['bar'] }));
      expect(labels.map(label => label.ctx.role)).toEqual(['bar', 'bar']);
    });

    it('labels one series by name', () => {
      const labels = labelsOf(composed({ series: ['costs'] }));
      expect(labels.map(label => label.ctx.seriesIndex)).toEqual([1, 1]);
    });

    it('labels a line without points where its points would be', () => {
      const withPoints = draw(
        lineChartConfig(
          { series: [[1, 3, 2]] },
          { layers: { above: [valueLabels()] } }
        )
      ).scene;
      const withoutPoints = draw(
        lineChartConfig(
          { series: [[1, 3, 2]] },
          { showPoint: false, layers: { above: [valueLabels()] } }
        )
      ).scene;
      expect(findAll(withoutPoints, { role: 'point' })).toHaveLength(0);
      expect(labelsOf(withoutPoints).map(label => label.attrs)).toEqual(
        labelsOf(withPoints).map(label => label.attrs)
      );
    });
  });

  describe('text and format', () => {
    it('writes a unit', () => {
      const { scene } = bars([[42]], {}, { format: item => `${item.value} %` });
      expect(texts(scene)).toEqual(['42 %']);
    });

    it('writes the default text with Intl.NumberFormat', () => {
      const { scene } = bars(
        [[1250]],
        {},
        {
          locale: 'de-CH',
          numberFormat: { style: 'currency', currency: 'CHF' }
        }
      );
      expect(texts(scene)).toEqual([
        new Intl.NumberFormat('de-CH', {
          style: 'currency',
          currency: 'CHF'
        }).format(1250)
      ]);
    });

    it('writes text from meta on stacked horizontal bars (#1401)', () => {
      const { scene } = bars(
        [[{ value: 59.62, meta: 'WO 54182526' }], [{ value: 20, meta: 'x' }]],
        { horizontalBars: true, stackBars: true },
        { format: item => `${String(item.meta)}: ${String(item.value)}` }
      );
      expect(texts(scene)).toContain('WO 54182526: 59.62');
    });

    it('gives format the tooltip item, typed by role', () => {
      const items: unknown[] = [];
      draw(
        barChartConfig(
          { labels: ['Q1'], series: [{ name: 'sales', data: [7] }] },
          {
            layers: {
              above: [
                valueLabels({
                  format: item => {
                    items.push(item);
                    if (item.role === 'bar') {
                      expectTypeOf(item.context.x2).toBeNumber();
                    }
                    return undefined;
                  }
                })
              ]
            }
          }
        )
      );
      expect(items[0]).toMatchObject({
        role: 'bar',
        seriesIndex: 0,
        valueIndex: 0,
        value: 7,
        seriesName: 'sales',
        label: 'Q1'
      });
    });

    it('keeps the default text for undefined, and draws none for null or empty', () => {
      const { scene } = draw({
        data: {
          labels: ['a', 'b'],
          series: [
            [5, 6],
            [3, 4]
          ]
        },
        axes: cartesianAxes([
          { id: 'x', side: 'bottom', type: stepAxis() },
          { id: 'y', side: 'left', type: autoScaleAxis(), low: 0 }
        ]),
        layers: [
          bar({ series: [0] }),
          line({ series: [1] }),
          valueLabels({
            format: item =>
              item.role === 'bar'
                ? undefined
                : item.valueIndex === 0
                  ? null
                  : 'point'
          })
        ]
      });
      expect(texts(scene)).toEqual(['5', '6', 'point']);
      const { scene: empty } = bars([[5]], {}, { format: () => '' });
      expect(labelsOf(empty)).toHaveLength(0);
    });

    it('stacks lines for a line break', () => {
      const { scene } = bars([[5]], {}, { format: () => 'Q3\n1,250' });
      const [label] = labelsOf(scene);
      expect(label.children.map(child => child.name)).toEqual([
        'tspan',
        'tspan'
      ]);
      expect(textOf(label)).toBe('Q3\n1,250');
      expect(label.children[1].attrs.dy).toBe(14);
    });

    it('labels zero, and skips holes without calling format', () => {
      const calls: number[] = [];
      const { scene } = draw(
        lineChartConfig(
          { series: [[0, 2, null, 4]] },
          {
            layers: {
              above: [
                valueLabels({
                  format: item => {
                    calls.push(item.valueIndex);
                    return undefined;
                  }
                })
              ]
            }
          }
        )
      );
      expect(texts(scene)).toEqual(['0', '2', '4']);
      expect(calls).toEqual([0, 1, 3]);
    });
  });

  describe('positions', () => {
    const point = (labels: ValueLabelsOptions = {}) => {
      const { scene } = draw(
        lineChartConfig(
          { labels: ['a', 'b', 'c'], series: [[1, 3, 5]] },
          { layers: { above: [valueLabels(labels)] } }
        )
      );
      const target = findAll(scene, { role: 'point' })[1];
      return { point: target.ctx, label: labelsOf(scene)[1] };
    };

    it('puts point labels 8 px above the point by default, centered', () => {
      const { point: p, label } = point();
      expect(label.attrs['text-anchor']).toBe('middle');
      expect(label.attrs.x).toBeCloseTo(p.x);
      // Bottom edge 8 px above the point: top + 14 = y - 8.
      expect(label.attrs.y as number).toBeCloseTo(
        p.y - 8 - 14 + textAscent * 12
      );
    });

    it('puts point labels to the right, vertically centered', () => {
      const { point: p, label } = point({ pointPosition: 'right', offset: 6 });
      expect(label.attrs['text-anchor']).toBe('start');
      expect(label.attrs.x).toBeCloseTo(p.x + 6);
      expect(label.attrs.y as number).toBeCloseTo(p.y - 7 + textAscent * 12);
    });

    it('labels vertical bars 4 px past their end', () => {
      const { scene } = bars([[5, 8]]);
      const [b] = findAll(scene, { role: 'bar' });
      const [label] = labelsOf(scene);
      expect(label.attrs.x).toBeCloseTo(b.ctx.x1);
      expect((label.attrs.y as number) - textAscent * 12 + 14).toBeCloseTo(
        b.ctx.y2 - 4
      );
    });

    it('labels horizontal bars 4 px right of their end', () => {
      const { scene } = bars([[5, 8]], { horizontalBars: true });
      const [b] = findAll(scene, { role: 'bar' });
      const [label] = labelsOf(scene);
      expect(label.attrs['text-anchor']).toBe('start');
      expect(label.attrs.x).toBeCloseTo(b.ctx.x2 + 4);
      expect(label.attrs.y as number).toBeCloseTo(
        b.ctx.y1 - 7 + textAscent * 12
      );
    });

    it('labels negative bars below their end', () => {
      const { scene } = bars([[-3, 5]], { low: -6 });
      const [b] = findAll(scene, { role: 'bar' });
      const [label] = labelsOf(scene);
      expect((label.attrs.y as number) - textAscent * 12).toBeCloseTo(
        b.ctx.y2 + 4
      );
    });

    it('centers labels in stacked segments', () => {
      const { scene } = bars(
        [
          [5, 6],
          [4, 3],
          [6, 5]
        ],
        { stackBars: true }
      );
      const segments = findAll(scene, { role: 'bar' });
      labelsOf(scene).forEach((label, index) => {
        const b = segments[index].ctx;
        expect(label.ctx.position).toBe('center');
        expect(label.attrs.x).toBeCloseTo(b.x1);
        expect((label.attrs.y as number) - textAscent * 12 + 7).toBeCloseTo(
          (b.y1 + b.y2) / 2
        );
        expect(label.classes).toContain('ct-value-label-inside');
      });
    });

    it('puts labels inside a tall bar end', () => {
      const { scene } = bars([[5, 8]], {}, { barPosition: 'inside-end' });
      const [b] = findAll(scene, { role: 'bar' });
      const [label] = labelsOf(scene);
      expect((label.attrs.y as number) - textAscent * 12).toBeCloseTo(
        b.ctx.y2 + 4
      );
      expect(label.classes).toContain('ct-value-label-inside');
    });
  });

  describe('fitting', () => {
    it('moves a centered label past a short bar', () => {
      const { scene } = bars([[0.2, 10]], {}, { barPosition: 'center' });
      const [label] = labelsOf(scene);
      expect(label.ctx.position).toBe('end');
      expect(label.classes).not.toContain('ct-value-label-inside');
    });

    it('leaves out the label of a thin stacked segment', () => {
      const { scene } = bars(
        [
          [10, 10],
          [0.2, 10]
        ],
        { stackBars: true }
      );
      expect(
        labelsOf(scene).map(l => [l.ctx.seriesIndex, l.ctx.valueIndex])
      ).toEqual([
        [0, 0],
        [0, 1],
        [1, 1]
      ]);
    });

    it('puts the highest bar’s label inside when there is no room above', () => {
      const { scene } = bars([[3, 10]], { high: 10, chartPadding: { top: 2 } });
      const label = labelsOf(scene)[1];
      expect(label.ctx.position).toBe('inside-end');
      expect(label.classes).toContain('ct-value-label-inside');
    });

    it('moves the first point label right to the padding edge', () => {
      const { scene, area } = draw(
        lineChartConfig(
          { labels: ['a', 'b'], series: [[1, 2]] },
          {
            chartPadding: { left: 0 },
            axisY: { offset: 0, showLabel: false },
            layers: {
              above: [valueLabels({ format: () => 'a long label' })]
            }
          }
        )
      );
      const [label] = labelsOf(scene);
      expect((label.attrs.x as number) - (6 * 12) / 2).toBeCloseTo(area.x1);
    });

    it('draws every label where its position puts it with overflow show', () => {
      const { scene } = bars(
        [
          [10, 10],
          [0.2, 10]
        ],
        { stackBars: true },
        { overflow: 'show' }
      );
      expect(labelsOf(scene)).toHaveLength(4);
    });
  });

  describe('modes, classes and nodes', () => {
    it('draws SVG text even when the chart draws HTML labels', () => {
      const scene = toScene(
        barChartConfig(
          { labels: ['a'], series: [[5]] },
          { layers: { above: [valueLabels()] } }
        ),
        { ...SIZE, labels: 'html' }
      );
      expect(labelsOf(scene)[0].name).toBe('text');
    });

    it('draws HTML labels in a foreignObject', () => {
      const { scene } = bars([[5]], {}, { labels: 'html' });
      const [label] = labelsOf(scene);
      expect(label.name).toBe('foreignObject');
      expect(label.attrs).toMatchObject({ width: 6, height: 14 });
      expect(label.children[0].classes).toContain('ct-value-label');
      expect(label.children[0].content).toBe('5');
    });

    it('gives labels their series class, and takes class names', () => {
      const { scene } = draw(
        lineChartConfig(
          { series: [[1], [2]] },
          { layers: { above: [valueLabels()] } }
        )
      );
      expect(labelsOf(scene)[1].classes).toEqual([
        'ct-value-label',
        'ct-series-b'
      ]);
      const { scene: renamed } = bars(
        [[5, 1]],
        {},
        {
          barPosition: 'inside-end',
          overflow: 'show',
          classNames: { group: 'labels', label: 'value', inside: 'in' }
        }
      );
      expect(labelsOf(renamed)[0].classes).toEqual([
        'value',
        'ct-series-a',
        'in'
      ]);
      expect(renderToString(renamed)).toContain('class="labels"');
    });

    it('keys labels like their values, so listeners find and drop them', () => {
      const { scene } = draw(
        barChartConfig(
          {
            labels: ['a', 'b'],
            series: [
              [0, 4],
              [2, 3]
            ]
          },
          {
            layers: { above: [valueLabels()] },
            on: {
              compose: current =>
                current.role === 'valueLabel' && current.ctx.text === '0'
                  ? null
                  : current
            }
          }
        )
      );
      const labels = labelsOf(scene);
      expect(labels.map(label => label.ctx.text)).toEqual(['4', '2', '3']);
      const second = labels.filter(label => label.ctx.seriesIndex === 1);
      expect(second.map(label => label.ctx.valueIndex)).toEqual([0, 1]);
      expect(second[0].key).toMatch(/\/1\/0$/);
    });
  });
});
