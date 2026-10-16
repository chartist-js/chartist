/**
 * Random updates: after every step of a seeded random sequence of updates,
 * a chart patched by the live renderer has the markup of a chart freshly
 * created with that step's data, options and size.
 */
import {
  autoScaleAxis,
  axisGrid,
  axisLabels,
  bar,
  barChart,
  cartesianAxes,
  chart,
  line,
  lineChart,
  pieChart,
  stepAxis,
  type ChartHandle,
  type Renderer
} from '../index';
import { liveDomRenderer } from './renderer';
import type { ValueKey } from './types';

/** A seeded pseudo-random generator (mulberry32), from 0 to 1. */
function random(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Next = () => number;

const int = (next: Next, max: number) => Math.floor(next() * max);
const pick = <T>(next: Next, items: readonly T[]) =>
  items[int(next, items.length)];

/**
 * Serializes an element with its attributes sorted (the patcher appends
 * attributes it adds again), leaving out update animations.
 */
function markup(element: Element): string {
  const attrs = Array.from(element.attributes)
    .map(a => `${a.name}="${a.value}"`)
    .sort()
    .join(' ');
  const children = Array.from(element.childNodes)
    .filter(
      child =>
        child.nodeType !== 1 ||
        !(child as Element).classList.contains('ct-update-animation')
    )
    .map(child =>
      child.nodeType === 1 ? markup(child as Element) : child.textContent
    )
    .join('');
  return `<${element.tagName} ${attrs}>${children}</${element.tagName}>`;
}

/** A value: a number, or with a meta id for keys from meta. */
interface Value {
  readonly value: number;
  readonly id: number;
}

/** The state a sequence changes: labels, series and options. */
interface State {
  labels: string[];
  series: Value[][];
  options: Record<string, unknown>;
  width: number;
  height: number;
}

interface ChartType {
  readonly name: string;
  /** Creates the chart with a renderer (the default one when undefined). */
  readonly create: (
    container: Element,
    state: State,
    withMeta: boolean,
    renderer?: Renderer
  ) => ChartHandle;
  /** Updates the chart to the state. */
  readonly update: (
    chart: ChartHandle,
    state: State,
    withMeta: boolean
  ) => void;
  /** Random option changes. */
  readonly options: (next: Next) => Record<string, unknown>;
  /** Pie data: one value per series. */
  readonly flat?: boolean;
}

const LABELS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

function series(state: State, withMeta: boolean) {
  return state.series.map(values =>
    values.map(({ value, id }) => (withMeta ? { value, meta: { id } } : value))
  );
}

function presetType(
  name: string,
  create: typeof lineChart | typeof barChart,
  base: Record<string, unknown>,
  options: (next: Next) => Record<string, unknown>
): ChartType {
  const all = (state: State) => ({
    ...base,
    ...state.options,
    width: state.width,
    height: state.height
  });
  const data = (state: State, withMeta: boolean) => ({
    labels: [...state.labels],
    series: series(state, withMeta)
  });
  return {
    name,
    create: (container, state, withMeta, renderer) =>
      create(container, data(state, withMeta) as never, {
        ...all(state),
        ...(renderer && { renderer })
      }),
    update: (chart, state, withMeta) => {
      const preset = chart as ReturnType<typeof lineChart>;
      preset.setOptions(all(state), { replace: true });
      preset.update({ data: data(state, withMeta) });
    },
    options
  };
}

const pieType = (name: string, donut: boolean): ChartType => {
  const all = (state: State) => ({
    donut,
    ...state.options,
    width: state.width,
    height: state.height
  });
  const data = (state: State, withMeta: boolean) => ({
    labels: [...state.labels],
    series: state.series.map(([first]) =>
      withMeta ? { value: first.value, meta: { id: first.id } } : first.value
    )
  });
  return {
    name,
    flat: true,
    create: (container, state, withMeta, renderer) =>
      pieChart(container, data(state, withMeta) as never, {
        ...all(state),
        ...(renderer && { renderer })
      }),
    update: (chart, state, withMeta) => {
      const preset = chart as ReturnType<typeof pieChart>;
      preset.setOptions(all(state), { replace: true });
      preset.update({ data: data(state, withMeta) });
    },
    options: next => ({
      ...(next() > 0.7 && { donut: !donut }),
      showLabel: next() > 0.2,
      startAngle: pick(next, [0, 90, 180]),
      labelOffset: pick(next, [0, 20]),
      ...(next() > 0.5 && { donutWidth: pick(next, [20, '30%']) })
    })
  };
};

function composedConfig(state: State, withMeta: boolean) {
  const values = series(state, withMeta);
  const width = Math.max(...values.map(v => v.length), state.labels.length);
  const labels = state.labels.slice(0, width);
  return {
    data: { labels, series: values },
    axes: cartesianAxes([
      { id: 'days', side: 'bottom', type: stepAxis(), ticks: labels },
      { id: 'left', side: 'left', type: autoScaleAxis(), referenceValue: 0 },
      { id: 'right', side: 'right', type: autoScaleAxis() }
    ]),
    layers: [
      axisGrid({ axes: ['days', 'left'] }),
      bar({ series: [0], x: 'days', y: 'left' }),
      line({
        series: values.map((_, i) => i).filter(i => i > 0),
        x: 'days',
        y: 'right',
        showArea: Boolean(state.options.showArea)
      }),
      axisLabels()
    ],
    width: state.width,
    height: state.height
  };
}

const TYPES: readonly ChartType[] = [
  presetType('line', lineChart, {}, next => ({
    showArea: next() > 0.5,
    showPoint: next() > 0.3,
    showLine: next() > 0.2,
    fullWidth: next() > 0.5,
    lineSmooth: next() > 0.5,
    low: next() > 0.8 ? 0 : undefined,
    axisX: { position: pick(next, ['start', 'end']) }
  })),
  presetType('bar', barChart, {}, next => ({
    seriesBarDistance: pick(next, [10, 15]),
    reverseData: next() > 0.8,
    axisY: { position: pick(next, ['start', 'end']) }
  })),
  presetType('stacked bar', barChart, { stackBars: true }, next => ({
    stackMode: pick(next, ['accumulate', 'overlap'])
  })),
  presetType('horizontal bar', barChart, { horizontalBars: true }, next => ({
    seriesBarDistance: pick(next, [10, 15]),
    stackBars: next() > 0.7
  })),
  pieType('pie', false),
  pieType('donut', true),
  {
    name: 'composed',
    create: (container, state, withMeta, renderer) =>
      chart(container, {
        ...composedConfig(state, withMeta),
        ...(renderer && { renderer })
      }),
    update: (handle, state, withMeta) =>
      handle.update(composedConfig(state, withMeta)),
    options: next => ({ showArea: next() > 0.5 })
  }
];

const KEYS: readonly { name: string; key: ValueKey; withMeta: boolean }[] = [
  { name: 'index', key: 'index', withMeta: false },
  { name: 'label', key: 'label', withMeta: false },
  {
    name: 'meta',
    // With `reverseData`, a bar chart's values don't all carry their meta.
    key: ({ meta, valueIndex }) =>
      (meta as { id?: number } | undefined)?.id ?? `at ${valueIndex}`,
    withMeta: true
  }
];

/** One random step: changes the state in place and says what it did. */
function step(next: Next, state: State, type: ChartType, ids: () => number) {
  const length = Math.max(1, ...state.series.map(values => values.length));
  const value = () => ({
    value: int(next, 21) - (type.flat ? 0 : 5),
    id: ids()
  });
  const newLabel = () =>
    next() > 0.85 ? pick(next, LABELS) : `${pick(next, LABELS)}${ids()}`;
  const choice = int(next, 9);
  if (choice <= 2) {
    // A value changes.
    const values = pick(next, state.series);
    if (values.length) {
      const index = int(next, values.length);
      values[index] = { ...values[index], value: value().value };
    }
    return 'value';
  }
  if (choice === 3 && !type.flat) {
    // The window slides.
    state.labels = [...state.labels.slice(1), newLabel()];
    state.series = state.series.map(values => [...values.slice(1), value()]);
    return 'slide';
  }
  if (choice === 4) {
    // A value more, or one less, at the end.
    if (next() > 0.5 || length < 2) {
      state.labels = [...state.labels, newLabel()];
      if (type.flat) {
        state.series = [...state.series, [value()]];
      } else {
        state.series = state.series.map(values => [...values, value()]);
      }
      return 'append';
    }
    state.labels = state.labels.slice(0, -1);
    state.series = type.flat
      ? state.series.slice(0, -1)
      : state.series.map(values => values.slice(0, -1));
    return 'pop';
  }
  if (choice === 5) {
    // A series more, or one less.
    if (type.flat) {
      return 'none';
    }
    if (next() > 0.5 || state.series.length < 2) {
      state.series = [
        ...state.series,
        Array.from({ length: int(next, length + 1) + 1 }, value)
      ];
      return 'add series';
    }
    const index = int(next, state.series.length);
    state.series = state.series.filter((_, i) => i !== index);
    return 'remove series';
  }
  if (choice === 6) {
    state.options = type.options(next);
    return 'options';
  }
  if (choice === 7) {
    state.width = pick(next, [200, 400, 600]);
    state.height = pick(next, [150, 250]);
    return 'size';
  }
  // A label changes.
  if (state.labels.length) {
    state.labels[int(next, state.labels.length)] = newLabel();
  }
  return 'label';
}

function initial(next: Next, type: ChartType, ids: () => number): State {
  const count = type.flat ? int(next, 4) + 2 : int(next, 3) + 1;
  const length = type.flat ? 1 : int(next, 5) + 3;
  return {
    labels: Array.from(
      { length: type.flat ? count : length },
      (_, i) => LABELS[i % LABELS.length]
    ),
    series: Array.from({ length: count }, () =>
      Array.from({ length }, () => ({ value: int(next, 10) + 1, id: ids() }))
    ),
    options: type.options(next),
    width: 400,
    height: 250
  };
}

/** Runs a sequence and returns the first step whose markup differs. */
function run(
  type: ChartType,
  mode: (typeof KEYS)[number],
  seed: number,
  steps: number
) {
  const next = random(seed);
  let id = 0;
  const ids = () => ++id;
  const state = initial(next, type, ids);
  const live = document.createElement('div');
  const fresh = document.createElement('div');
  document.body.append(live, fresh);
  const renderer = liveDomRenderer({ key: mode.key });
  const handle = type.create(live, state, mode.withMeta, renderer);
  const svg = live.querySelector('svg');
  try {
    for (let i = 0; i < steps; i++) {
      const what = step(next, state, type, ids);
      type.update(handle, state, mode.withMeta);
      const other = type.create(fresh, state, mode.withMeta);
      const patched = markup(live.querySelector('svg')!);
      const expected = markup(fresh.querySelector('svg')!);
      other.destroy();
      if (live.querySelector('svg') !== svg) {
        return `seed ${seed}, step ${i} (${what}): the svg was replaced`;
      }
      if (patched !== expected) {
        return `seed ${seed}, step ${i} (${what}):\n${patched}\n!==\n${expected}`;
      }
    }
    return undefined;
  } finally {
    handle.destroy();
    live.remove();
    fresh.remove();
  }
}

describe('live/random updates', () => {
  const SEED = 20261016;
  const STEPS = 200;

  for (const type of TYPES) {
    it(`patches a ${type.name} chart to the markup of a fresh one`, () => {
      // The steps split over the three key modes, with a seed each.
      for (const [index, mode] of KEYS.entries()) {
        const steps = Math.ceil(STEPS / KEYS.length);
        const failure = run(type, mode, SEED + index, steps);
        expect(failure, `key: ${mode.name}`).toBeUndefined();
      }
      // Two renders per step in jsdom: under a second here, but several
      // times that on a busy CI runner.
    }, 30_000);
  }
});
