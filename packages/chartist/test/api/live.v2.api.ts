import {
  barChart,
  lineChart,
  lineChartConfig,
  pieChart,
  toScene,
  type PhaseEvents
} from 'chartist';
import { compat } from 'chartist/compat';
import { diffScenes, liveDomRenderer, smilAnimations } from 'chartist/live';
import { renderForHydration } from 'chartist/server';
import {
  LIVE_LIST_FILE,
  cjsNames,
  diffNames,
  esmNames,
  readList,
  typeNames,
  umdNames
} from './exports/read.ts';
import { container } from './fixture.ts';

const SIZE = { width: 400, height: 200 };

describe('chartist/live entry', () => {
  test('exports match the recorded list', async () => {
    const list = readList(LIVE_LIST_FILE);
    const none = { listedButNotExported: [], exportedButNotListed: [] };
    expect(diffNames(list.runtime, await esmNames('local', 'live'))).toEqual(
      none
    );
    expect(diffNames(list.runtime, cjsNames('local', 'live'))).toEqual(none);
    expect(diffNames(list.types, typeNames('local', 'live'))).toEqual(none);
  });

  test('the UMD build adds its exports to the global Chartist', () => {
    const core = umdNames('local');
    const names = umdNames('local', ['index', 'live']);
    const added = names.filter(name => !core.includes(name));
    expect(added).toEqual(readList(LIVE_LIST_FILE).runtime);
  });
});

describe('liveDomRenderer (v2)', () => {
  test('a preset that opts in keeps its svg and elements', () => {
    const el = container();
    const chart = lineChart(
      el,
      { series: [[1, 2, 3, 4, 5]] },
      { ...SIZE, renderer: liveDomRenderer() }
    );
    const svg = el.querySelector('svg');
    const points = Array.from(el.querySelectorAll('.ct-point'));
    chart.update({ data: { series: [[1, 2, 9, 4, 5]] } });
    expect(el.querySelector('svg')).toBe(svg);
    expect(Array.from(el.querySelectorAll('.ct-point'))).toEqual(points);
    el.querySelectorAll('.ct-point').forEach((point, i) =>
      expect(point).toBe(points[i])
    );
  });

  test('mount gets the changes of a patched render', () => {
    const el = container();
    const events: PhaseEvents['mount'][] = [];
    const chart = barChart(
      el,
      { series: [[5, 4, 3]] },
      {
        ...SIZE,
        low: 0,
        high: 10,
        renderer: liveDomRenderer(),
        on: { mount: event => void events.push(event) }
      }
    );
    chart.update({ data: { series: [[5, 8, 3]] } });
    const { cause, changes, output, elementOf } = events[1];
    expect(cause).toBe('update');
    expect(output.patched).toBe(true);
    expect(changes.map(({ op, node }) => `${op} ${node.role}`)).toEqual([
      'update bar'
    ]);
    expect(elementOf(changes[0].node)).toBe(el.querySelectorAll('.ct-bar')[1]);
  });

  test('keys values by label', () => {
    const el = container();
    const chart = lineChart(
      el,
      { labels: ['Mo', 'Tu', 'We'], series: [[1, 2, 3]] },
      { ...SIZE, renderer: liveDomRenderer({ key: 'label' }) }
    );
    const [, tuesday] = Array.from(el.querySelectorAll('.ct-point'));
    chart.update({
      data: { labels: ['Tu', 'We', 'Th'], series: [[2, 3, 4]] }
    });
    expect(el.querySelectorAll('.ct-point')[0]).toBe(tuesday);
  });

  test('a 1.x chart gets a new svg on every render', () => {
    const el = container();
    const chart = pieChart(
      el,
      { series: [1, 2] },
      { ...SIZE, renderer: liveDomRenderer(), plugins: [compat] }
    );
    const svg = el.querySelector('svg');
    chart.update({ data: { series: [2, 1] } });
    expect(el.querySelector('svg')).not.toBe(svg);
  });

  test('smilAnimations() plugs into the renderer', () => {
    const el = container();
    const chart = lineChart(
      el,
      { series: [[1, 2]] },
      { ...SIZE, renderer: liveDomRenderer({ animations: smilAnimations() }) }
    );
    const svg = el.querySelector('svg');
    chart.update({ data: { series: [[2, 1]] } });
    expect(el.querySelector('svg')).toBe(svg);
  });
});

describe('liveDomRenderer and renderForHydration (v2)', () => {
  const data = { labels: ['a', 'b', 'c'], series: [[1, 3, 2]] };
  // The fixture's svgs measure 500 × 500.
  const server = () =>
    renderForHydration(lineChartConfig(data), { width: 500, height: 500 });

  test('a chart takes the server markup over and patches it', () => {
    const el = container();
    el.innerHTML = server();
    const svg = el.querySelector('svg');
    const points = Array.from(el.querySelectorAll('.ct-point'));
    const mounts: PhaseEvents['mount'][] = [];
    const chart = lineChart(el, data, {
      renderer: liveDomRenderer(),
      on: { mount: event => void mounts.push(event) }
    });
    expect(el.querySelector('svg')).toBe(svg);
    expect(Array.from(el.querySelectorAll('.ct-point'))).toEqual(points);
    expect(
      mounts.map(({ cause, hydration }) => ({ cause, hydration }))
    ).toEqual([{ cause: 'hydrate', hydration: { repaired: 0 } }]);
    expect(svg!.hasAttribute('data-ct-hydrate')).toBe(false);
    chart.update({ data: { ...data, series: [[2, 1, 3]] } });
    expect(el.querySelector('svg')).toBe(svg);
    expect(mounts.at(-1)!.cause).toBe('update');
  });

  test('adopt: false draws a new svg over the server markup', () => {
    const el = container();
    el.innerHTML = server();
    const svg = el.querySelector('svg');
    lineChart(el, data, { renderer: liveDomRenderer({ adopt: false }) });
    expect(el.querySelectorAll('svg')).toHaveLength(1);
    expect(el.querySelector('svg')).not.toBe(svg);
  });
});

describe('diffScenes (v2)', () => {
  test('lists the changes between two scenes without a chart', () => {
    const before = toScene(lineChartConfig({ series: [[1, 2, 3]] }), SIZE);
    const after = toScene(lineChartConfig({ series: [[1, 2, 3, 4]] }), SIZE);
    const points = diffScenes(before, after).filter(
      ({ node }) => node.role === 'point'
    );
    // The first point stays where it was; the others move left.
    expect(points.map(({ op }) => op)).toEqual(['update', 'update', 'add']);
    expect(points[2].node.key).toBe('1/0/3');
  });
});
