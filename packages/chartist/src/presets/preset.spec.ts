import { compat, fromLegacyPlugin } from '../compat';
import { lineChart } from './lineChart';

/** Minimal ResizeObserver stub that the test triggers by hand. */
function stubResizeObserver() {
  const observers: { callback: () => void; disconnected: boolean }[] = [];
  vi.stubGlobal(
    'ResizeObserver',
    function ResizeObserver(this: unknown, callback: () => void) {
      const entry = { callback, disconnected: false };
      observers.push(entry);
      return {
        observe: () => undefined,
        unobserve: () => undefined,
        disconnect: () => {
          entry.disconnected = true;
        }
      };
    }
  );
  return {
    active: () => observers.filter(o => !o.disconnected).length
  };
}

function sized() {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => 400 },
    clientHeight: { get: () => 200 }
  });
  document.body.appendChild(element);
  return element;
}

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('presets/preset', () => {
  it('a converted 1.x plugin detaching in created stops resizing (#929)', () => {
    const resize = stubResizeObserver();
    let created = 0;
    const detaching = fromLegacyPlugin(
      (chart: { on(event: string, fn: () => void): void; detach(): void }) =>
        chart.on('created', () => {
          created++;
          chart.detach();
        })
    );
    expect(() =>
      lineChart(sized(), { series: [[1, 2]] }, { plugins: [compat, detaching] })
    ).not.toThrow();
    expect(created).toBe(1);
    expect(resize.active()).toBe(0);
  });
});
