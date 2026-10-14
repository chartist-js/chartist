/**
 * The helper functions and constants 1.x exports from the package root.
 * They stay public in v2, so their 1.5 results are recorded here.
 */
import {
  EPSILON,
  EventEmitter,
  StepAxis,
  Svg,
  alphaNumerate,
  axisUnits,
  createChartRect,
  createGrid,
  createGridBackground,
  createLabel,
  createSvg,
  deserialize,
  determineAnchorPosition,
  each,
  ensureUnit,
  escapingMap,
  extend,
  getBounds,
  getHighLow,
  getMetaData,
  getMultiValue,
  getNumberOrUndefined,
  getSeriesOption,
  isArrayOfArrays,
  isArrayOfSeries,
  isDataHoleValue,
  isFalseyButZero,
  isMultiValue,
  isNumeric,
  namespaces,
  noop,
  normalizeData,
  normalizePadding,
  optionsProvider,
  orderOfMagnitude,
  polarToCartesian,
  precision,
  projectLength,
  quantity,
  rho,
  roundWithPrecision,
  safeHasProperty,
  serialMap,
  serialize,
  splitIntoSegments,
  sum,
  times,
  type Bounds,
  type ChartRect,
  type LineChartOptionsWithDefaults,
  type NormalizedSeries,
  type Options,
  type SegmentData
} from 'chartist';
import { container } from './fixture.ts';

describe('constants', () => {
  test('namespaces, escaping, precision, EPSILON and axis units', () => {
    expect(namespaces).toEqual({
      svg: 'http://www.w3.org/2000/svg',
      xmlns: 'http://www.w3.org/2000/xmlns/',
      xhtml: 'http://www.w3.org/1999/xhtml',
      xlink: 'http://www.w3.org/1999/xlink',
      ct: 'http://gionkunz.github.com/chartist-js/ct'
    });
    expect(escapingMap).toEqual({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    });
    expect(precision).toBe(8);
    expect(EPSILON).toBe(2.221e-16);
    expect(axisUnits.x).toEqual({
      pos: 'x',
      len: 'width',
      dir: 'horizontal',
      rectStart: 'x1',
      rectEnd: 'x2',
      rectOffset: 'y2'
    });
    expect(axisUnits.y.dir).toBe('vertical');
  });
});

describe('data helpers', () => {
  test('normalizeData: flat series pad the labels', () => {
    expect(normalizeData({ labels: ['a'], series: [1, 2] })).toEqual({
      labels: ['a', ''],
      series: [1, 2]
    });
  });

  test('normalizeData: multi-value series, holes and reverse', () => {
    expect(
      normalizeData({ series: [[1, null, { x: 1, y: 2 }]] }, false, true)
    ).toEqual({
      labels: ['', '', ''],
      series: [[{ x: undefined, y: 1 }, undefined, { x: 1, y: 2 }]]
    });
    expect(
      normalizeData({ labels: ['a', 'b'], series: [[1, 2]] }, true, true)
    ).toEqual({
      labels: ['b', 'a'],
      series: [
        [
          { x: undefined, y: 2 },
          { x: undefined, y: 1 }
        ]
      ]
    });
  });

  test('getMultiValue, getMetaData, getHighLow and getSeriesOption', () => {
    expect(getMultiValue({ x: 1, y: 2 })).toBe(2);
    expect(getMultiValue({ x: 1, y: 2 }, 'x')).toBe(1);
    expect(getMultiValue(3)).toBe(3);
    expect(getMetaData([{ value: 1, meta: 'm' }], 0)).toBe('m');
    expect(
      getHighLow(
        [
          [1, 5],
          [-2, 3]
        ] as NormalizedSeries[],
        {} as Options,
        'y'
      )
    ).toEqual({ high: 5, low: -2 });
    expect(
      getSeriesOption(
        { name: 's', data: [] },
        {
          series: { s: { showLine: false } },
          showLine: true
        } as unknown as LineChartOptionsWithDefaults,
        'showLine'
      )
    ).toBe(false);
    expect(
      getSeriesOption(
        [1],
        { showLine: true } as LineChartOptionsWithDefaults,
        'showLine'
      )
    ).toBe(true);
  });

  test('splitIntoSegments splits at holes', () => {
    const values = [1, undefined, 1].map(y => ({
      value: { y }
    })) as SegmentData[];
    expect(
      splitIntoSegments([0, 0, 1, 1, 2, 2], values).map(s => s.pathCoordinates)
    ).toEqual([
      [0, 0],
      [2, 2]
    ]);
  });

  test('serialize and deserialize escape for attributes', () => {
    expect(serialize('<a & "b">')).toBe('&lt;a &amp; &quot;b&quot;&gt;');
    expect(serialize({ a: 1 })).toBe('{&quot;data&quot;:{&quot;a&quot;:1}}');
    expect(deserialize('&lt;a&gt;')).toBe('<a>');
    expect(deserialize(serialize({ a: 1 }))).toEqual({ a: 1 });
    expect(deserialize('5')).toBe(5);
  });
});

describe('type checks', () => {
  test.each([
    [
      'isDataHoleValue',
      isDataHoleValue,
      [null, undefined, NaN, 0],
      [true, true, true, false]
    ],
    ['isMultiValue', isMultiValue, [{ x: 1 }, 1, null], [true, false, false]],
    [
      'isArrayOfSeries',
      isArrayOfSeries,
      [[[1]], [{ data: [] }], [1]],
      [true, true, false]
    ],
    ['isArrayOfArrays', isArrayOfArrays, [[[1]], [1]], [true, false]],
    [
      'isFalseyButZero',
      isFalseyButZero,
      [0, '', null, false, NaN, 1],
      [false, true, true, true, true, false]
    ],
    [
      'isNumeric',
      isNumeric,
      [1, '1', 'a', NaN, Infinity],
      [true, true, false, false, false]
    ]
  ] as [string, (value: any) => boolean, unknown[], boolean[]][])(
    '%s',
    (_name, check, inputs, expected) => {
      expect(inputs.map(input => check(input))).toEqual(expected);
    }
  );

  test('getNumberOrUndefined and safeHasProperty', () => {
    expect(getNumberOrUndefined('1.5' as unknown as number)).toBe(1.5);
    expect(getNumberOrUndefined('a' as unknown as number)).toBeUndefined();
    expect(safeHasProperty({ a: 1 }, 'a')).toBe(true);
    expect(safeHasProperty(null, 'a')).toBe(false);
  });
});

describe('math and utility functions', () => {
  test('numbers', () => {
    expect([1, 10, 999, 0.05].map(orderOfMagnitude)).toEqual([0, 1, 2, -2]);
    expect(rho(15)).toBe(3);
    expect(roundWithPrecision(1.23456789123)).toBe(1.23456789);
    expect(roundWithPrecision(1.256, 1)).toBe(1.3);
    expect([1, 2, 3].reduce(sum, 0)).toBe(6);
    expect(polarToCartesian(0, 0, 10, 90)).toEqual({ x: 10, y: 0 });
    expect(projectLength(100, 5, { range: 10 } as Bounds)).toBe(50);
  });

  test('getBounds computes the scale', () => {
    expect(getBounds(100, { high: 10, low: 0 }, 20, true)).toMatchObject({
      high: 10,
      low: 0,
      step: 2,
      min: 0,
      max: 10,
      values: [0, 2, 4, 6, 8, 10]
    });
  });

  test('units and padding', () => {
    expect(ensureUnit(10, 'px')).toBe('10px');
    expect(ensureUnit('10%', 'px')).toBe('10%');
    expect(quantity('10px')).toEqual({ value: 10, unit: 'px' });
    expect(quantity(5)).toEqual({ value: 5 });
    expect(normalizePadding(5)).toEqual({
      top: 5,
      right: 5,
      bottom: 5,
      left: 5
    });
    expect(normalizePadding({ top: 1 })).toEqual({
      top: 1,
      right: 0,
      bottom: 0,
      left: 0
    });
  });

  test('collections and functions', () => {
    expect(alphaNumerate(0)).toBe('a');
    expect(alphaNumerate(25)).toBe('z');
    expect(extend({ a: 1, b: { c: 1 } }, { b: { d: 2 } }, { e: 3 })).toEqual({
      a: 1,
      b: { c: 1, d: 2 },
      e: 3
    });
    expect(
      serialMap(
        [
          [1, 2],
          [3, 4]
        ],
        (a, b) => a + b
      )
    ).toEqual([4, 6]);
    expect(times(3)).toEqual([undefined, undefined, undefined]);
    const seen: unknown[] = [];
    each([1, 2], (value, index) => seen.push([value, index]));
    expect(seen).toEqual([
      [1, 0],
      [2, 1]
    ]);
    expect(noop(5)).toBe(5);
    expect(
      ['explode', 'neutral', 'implode'].map(direction =>
        determineAnchorPosition(
          { x: 0, y: 0 },
          { x: 5, y: 0 },
          direction as 'explode'
        )
      )
    ).toEqual(['start', 'middle', 'end']);
  });
});

describe('chart creation helpers', () => {
  const rect: ChartRect = {
    x1: 10,
    x2: 110,
    y1: 110,
    y2: 10,
    width: () => 100,
    height: () => 100,
    padding: { top: 0, right: 0, bottom: 0, left: 0 }
  };

  test('createSvg adds a Chartist svg to a container', () => {
    const el = container();
    const svg = createSvg(el, '200px', '100px', 'my-chart');
    expect(svg).toBeInstanceOf(Svg);
    expect(el.querySelector('svg')!.getAttribute('class')).toBe('my-chart');
    expect(el.querySelector('svg')!.getAttribute('width')).toBe('200px');
  });

  test('createChartRect derives the drawing area from options', () => {
    const svg = createSvg(container(), '200px', '100px');
    const chartRect = createChartRect(svg, {
      chartPadding: 5,
      axisX: { offset: 30, position: 'end' },
      axisY: { offset: 40, position: 'start' }
    });
    expect([chartRect.x1, chartRect.y2]).toEqual([45, 5]);
    expect(chartRect.width()).toBeGreaterThan(0);
  });

  test('createGrid, createGridBackground and createLabel draw and emit', () => {
    const emitter = new EventEmitter();
    const draws: string[] = [];
    emitter.on('draw', (event: { type: string }) => draws.push(event.type));
    const group = new Svg('g');
    const axis = new StepAxis(axisUnits.x, [], rect, { ticks: ['a', 'b'] });

    createGrid(20, 0, axis, 10, 100, group, ['ct-grid'], emitter);
    createGridBackground(group, rect, 'ct-grid-background', emitter);
    createLabel(
      20,
      50,
      0,
      'a',
      axis,
      10,
      { x: 0, y: 0 },
      group,
      ['ct-label'],
      emitter
    );

    expect(draws).toEqual(['grid', 'gridBackground', 'label']);
    const node = group.getNode();
    expect(node.querySelector('line.ct-grid')).not.toBeNull();
    expect(node.querySelector('rect.ct-grid-background')).not.toBeNull();
    expect(node.querySelector('foreignObject span.ct-label')!.textContent).toBe(
      'a'
    );
  });

  test('optionsProvider resolves responsive options', () => {
    const provider = optionsProvider(
      { showLine: true },
      [['all', { showArea: true }]],
      new EventEmitter()
    );
    expect(provider.getCurrentOptions()).toEqual({ showLine: true });
    provider.removeMediaQueryListeners();
  });
});
