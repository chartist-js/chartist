import { LineChart, lineChart, type PhaseEvents } from 'chartist';
import { compat, fromLegacyPlugin } from 'chartist/compat';
import {
  COMPAT_LIST_FILE,
  diffNames,
  esmNames,
  readList,
  typeNames
} from './exports/read.ts';
import { container, created } from './fixture.ts';

const SIZE = { width: 400, height: 200 };

afterEach(() => vi.restoreAllMocks());

describe('chartist/compat entry', () => {
  test('exports match the recorded list', async () => {
    const list = readList(COMPAT_LIST_FILE);
    const none = { listedButNotExported: [], exportedButNotListed: [] };
    expect(diffNames(list.runtime, await esmNames('local', 'compat'))).toEqual(
      none
    );
    expect(diffNames(list.types, typeNames('local', 'compat'))).toEqual(none);
  });
});

describe('without compat', () => {
  test('a 1.x event listener logs a one-time warning', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const handle = lineChart(container(), { series: [[1]] }, SIZE);
    handle.on('draw', () => undefined).on('draw', () => undefined);
    const drawWarnings = warn.mock.calls.filter(([m]) =>
      String(m).includes('"draw"')
    );
    expect(drawWarnings.length).toBeLessThanOrEqual(1);
    expect(drawWarnings.every(([m]) => String(m).includes('compat'))).toBe(
      true
    );
  });

  test('the functional API rejects 1.x plugin functions', () => {
    const el = container();
    expect(() =>
      lineChart(el, { series: [[1]] }, { ...SIZE, plugins: [() => undefined] })
    ).toThrow(/fromLegacyPlugin\(\) from chartist\/compat/);
    expect(el.querySelector('svg')).toBeNull();
  });
});

describe('with compat', () => {
  test('a converted 1.x plugin gets draw events and the container on lineChart', () => {
    const el = container();
    const types = new Set<string>();
    let pluginContainer: unknown;
    const tooltip = (legacy: {
      container: Element;
      on(event: string, listener: (data: { type: string }) => void): unknown;
    }) => {
      pluginContainer = legacy.container;
      legacy.on('draw', data => void types.add(data.type));
    };
    lineChart(
      el,
      { series: [[1, 2]] },
      { ...SIZE, plugins: [fromLegacyPlugin(tooltip)] }
    );
    expect(pluginContainer).toBe(el);
    expect(types).toEqual(new Set(['grid', 'label', 'point', 'line']));
  });

  test('the class passes itself to 1.x plugins', async () => {
    let received: unknown;
    const plugin = (legacy: unknown) => {
      received = legacy;
    };
    const lineChart1x = new LineChart(
      container(),
      { series: [[1]] },
      {
        ...SIZE,
        plugins: [compat, plugin]
      }
    );
    await created(lineChart1x);
    expect(received).toBe(lineChart1x);
  });

  test('mixed plugins: a 1.x draw plugin and a v2 layout plugin both apply', () => {
    const marker = (legacy: {
      on(
        event: string,
        listener: (data: {
          type: string;
          group: { elem(name: string): unknown };
        }) => void
      ): unknown;
    }) =>
      legacy.on('draw', data => {
        if (data.type === 'line') {
          data.group.elem('circle');
        }
      });
    const reserveLegend = {
      name: 'legend-space',
      install: (handle: {
        on(
          name: 'layout',
          l: (layout: PhaseEvents['layout']) => PhaseEvents['layout']
        ): unknown;
      }) =>
        handle.on('layout', layout => ({
          ...layout,
          area: {
            ...layout.area,
            y1: layout.area.y1 - 40,
            height: layout.area.height - 40
          }
        }))
    };
    const handle = lineChart(
      container(),
      { series: [[1, 2]] },
      {
        ...SIZE,
        plugins: [fromLegacyPlugin(marker), reserveLegend as never]
      }
    );
    const svg = handle.container!.querySelector('svg')!;
    // The 1.x plugin's element is in the series group...
    expect(svg.querySelector('.ct-series circle')).not.toBeNull();
    // ...and the grid ends 40 px higher: 200 - 5 (padding) - 30 (x axis) - 40.
    expect(
      svg.querySelector('.ct-grids line.ct-horizontal')!.getAttribute('y2')
    ).toBe('125');
  });
});
