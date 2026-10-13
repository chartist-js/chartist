import { LineChart } from '../charts/LineChart/LineChart';
import { line } from '../layers/line';
import { lineChart } from '../presets/lineChart';
import { container, responsive } from '../responsive/responsive';
import { installFakeMatchContainer } from '../responsive/fakeContainer';
import { autoScaleAxis, stepAxis } from '../scales/factories';
import { cartesianAxes } from '../scales/cartesian';
import { chart } from './chart';

const NARROW = '(width < 400px)';
const data = { labels: ['a', 'b'], series: [[1, 2]] };

describe('responsive: chart()', () => {
  let fake: ReturnType<typeof installFakeMatchContainer>;
  beforeEach(() => {
    fake = installFakeMatchContainer();
  });
  afterEach(() => fake.uninstall());

  const config = () => ({
    data,
    axes: cartesianAxes({
      x: { type: stepAxis() },
      y: { type: autoScaleAxis() }
    }),
    layers: [line()],
    width: 300,
    height: 200,
    padding: 10,
    responsive: responsive([[container(NARROW), { padding: 5 }]])
  });

  it('applies matching overrides and re-renders when the set changes', () => {
    fake.set(NARROW, true, false);
    const el = document.createElement('div');
    const configs: unknown[] = [];
    const responsive: unknown[] = [];
    const handle = chart(el, {
      ...config(),
      on: {
        resolve: ({ config: resolved }) => void configs.push(resolved.padding)
      }
    });
    handle.on('responsive', payload => void responsive.push(payload));
    expect(configs).toEqual([{ top: 5, right: 5, bottom: 5, left: 5 }]);

    fake.set(NARROW, false);
    expect(configs.at(-1)).toEqual({
      top: 10,
      right: 10,
      bottom: 10,
      left: 10
    });
    expect(responsive).toHaveLength(1);

    // An unchanged matching set doesn't render.
    fake.set(NARROW, false);
    expect(configs).toHaveLength(2);

    handle.detach();
    fake.set(NARROW, true);
    expect(configs).toHaveLength(2);
  });

  it('update() replaces the entries; destroy() removes the probe', () => {
    const el = document.createElement('div');
    const handle = chart(el, config());
    expect(el.querySelector('.ct-probe')).not.toBeNull();
    handle.update({ responsive: undefined });
    expect(el.querySelector('.ct-probe')).toBeNull();
    handle.update({
      responsive: responsive([[container(NARROW), { padding: 5 }]])
    });
    expect(el.querySelector('.ct-probe')).not.toBeNull();
    handle.destroy();
    expect(el.querySelector('.ct-probe')).toBeNull();
  });
});

describe('responsive: presets and classes', () => {
  let fake: ReturnType<typeof installFakeMatchContainer>;
  beforeEach(() => {
    fake = installFakeMatchContainer();
  });
  afterEach(() => fake.uninstall());

  it('presets take container entries mixed with media queries', () => {
    const el = document.createElement('div');
    const events: unknown[] = [];
    const handle = lineChart(el, data, { width: 300, height: 200 }, [
      ['(min-width: 99999px)', { showArea: true }],
      [container(NARROW), { showPoint: false }]
    ]);
    handle.on('responsive', payload => void events.push(payload));
    expect(el.querySelectorAll('.ct-point').length).toBe(2);
    fake.set(NARROW, true);
    expect(el.querySelectorAll('.ct-point').length).toBe(0);
    expect(events).toHaveLength(1);
  });

  it('the 1.x classes ignore container entries', async () => {
    fake.set(NARROW, true, false);
    const el = document.createElement('div');
    const legacy = new LineChart(el, data, { width: 300, height: 200 }, [
      [container(NARROW) as never, { showPoint: false }]
    ]);
    await new Promise(resolve => setTimeout(resolve));
    legacy.detach();
    expect(el.querySelectorAll('.ct-point').length).toBe(2);
    expect(el.querySelector('.ct-probe')).toBeNull();
  });
});
