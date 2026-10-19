import {
  autoScaleAxis,
  cartesianAxes,
  chart,
  line,
  lineChart,
  node,
  stepAxis,
  toScene,
  type Layer,
  type Layout
} from 'chartist';
import { container } from './fixture.ts';

const SIZE = { width: 400, height: 300 };
const data = { labels: ['a', 'b', 'c'], series: [[1, 3, 2]] };
const axes = () =>
  cartesianAxes({
    x: { type: stepAxis(), ticks: data.labels },
    y: { type: autoScaleAxis() }
  });

/** A note below the chart, in room the layer reserves. */
function note(text: string): Layer {
  return {
    type: 'note',
    coordinates: ['cartesian'],
    series: [],
    inset: () => ({ bottom: 20 }),
    compose: ({ insetArea }) => {
      const box = insetArea?.bottom;
      return box
        ? [node('text', { x: box.x1, y: box.y1 }, 'ct-note').text(text)]
        : [];
    }
  };
}

describe('layers reserving room (v2)', () => {
  test('chart() lays out with the room and draws in the box', () => {
    const el = container();
    let payload: Layout | undefined;
    chart(el, {
      data,
      axes: cartesianAxes({
        x: { type: stepAxis(), offset: 30, ticks: data.labels },
        y: { type: autoScaleAxis(), offset: 40 }
      }),
      layers: [line(), note('Source: test')],
      on: {
        layout: current => {
          payload = current;
        }
      },
      ...SIZE
    });
    expect(payload!.inset).toEqual({ top: 0, right: 0, bottom: 20, left: 0 });
    expect(payload!.area.y1).toBe(300 - 5 - 20 - 30);
    const text = el.querySelector('text.ct-note')!;
    expect(text.textContent).toBe('Source: test');
    expect(Number(text.getAttribute('y'))).toBe(295);
  });

  test('presets take it through layers, and toScene draws it', () => {
    const el = container();
    lineChart(el, data, { ...SIZE, layers: { above: [note('Preset')] } });
    expect(el.querySelector('text.ct-note')!.textContent).toBe('Preset');

    const scene = toScene(
      { data, layers: [line(), note('Scene')], axes: axes() },
      SIZE
    );
    const found: string[] = [];
    const visit = (current: typeof scene) => {
      if (current.classes.includes('ct-note')) {
        found.push(String(current.content));
      }
      current.children.forEach(visit);
    };
    visit(scene);
    expect(found).toEqual(['Scene']);
  });

  test('charts without such a layer get no inset', () => {
    let payload: Layout | undefined;
    chart(container(), {
      data,
      axes: axes(),
      layers: [line()],
      on: {
        layout: current => {
          payload = current;
        }
      },
      ...SIZE
    });
    expect(payload).toBeDefined();
    expect('inset' in payload!).toBe(false);
  });
});
