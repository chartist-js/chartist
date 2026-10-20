import {
  barChart,
  lineChart,
  lineChartConfig,
  pieChart,
  toScene,
  type PhaseEvents,
  type UpdateAnimation
} from 'chartist';
import { targetLine, trendLine } from '@chartist-js/essentials';
import { liveDomRenderer, smilAnimations } from 'chartist/live';
import { renderForHydration } from 'chartist/server';
import { tooltips } from './plugin.ts';

// A role of a custom layer, declared as layers from other packages do.
declare module 'chartist' {
  interface NodeRoles {
    peak: {
      ctx: {
        readonly label: string;
        readonly value: number;
        readonly height: string;
      };
      attrs: { readonly cx: number; readonly cy: number; readonly r: number };
    };
  }
}
import type { TooltipItem } from './types.ts';

const week = {
  labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  series: [{ name: 'Visitors', data: [1200, 1500, 1350, 1600, 1100] }]
};

let width = 400;

/** A container with a size (jsdom has no layout). */
function container(markup = '') {
  const element = document.createElement('div');
  Object.defineProperties(element, {
    clientWidth: { get: () => width },
    clientHeight: { get: () => 200 }
  });
  element.innerHTML = markup;
  document.body.append(element);
  return element;
}

const tooltipOf = (element: Element) =>
  element.querySelector<HTMLElement>('.ct-tooltip')!;
const shows = (element: Element) => !tooltipOf(element).hidden;
const textIn = (element: Element) =>
  Array.from(
    tooltipOf(element).querySelectorAll('.ct-tooltip-content > *'),
    part => part.textContent
  );
const all = (element: Element, selector: string) =>
  Array.from(element.querySelectorAll(selector));

function pointer(
  type: string,
  target: EventTarget,
  init: PointerEventInit = {}
) {
  target.dispatchEvent(
    new PointerEvent(type, { bubbles: true, pointerType: 'mouse', ...init })
  );
}
const hover = (target: Element, init: PointerEventInit = {}) =>
  pointer('pointerover', target, init);
const leave = (target: Element, to: EventTarget | null = document.body) =>
  pointer('pointerout', target, { relatedTarget: to });
const key = (target: Element, name: string) =>
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: name, bubbles: true })
  );

beforeEach(() => {
  width = 400;
  // jsdom has no layout: a line's box from its attributes, others empty.
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(
    function (this: Element) {
      const at = (name: string) => Number(this.getAttribute(name) ?? 0);
      const [x1, x2, y1, y2] = ['x1', 'x2', 'y1', 'y2'].map(at);
      return {
        left: Math.min(x1, x2),
        top: Math.min(y1, y2),
        width: Math.abs(x2 - x1),
        height: Math.abs(y2 - y1),
        right: Math.max(x1, x2),
        bottom: Math.max(y1, y2),
        x: Math.min(x1, x2),
        y: Math.min(y1, y2),
        toJSON: () => ({})
      } as DOMRect;
    }
  );
});

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('tooltips()', () => {
  it('shows the label, the series name and the value of a point', () => {
    const element = container();
    lineChart(element, week, { plugins: [tooltips()] });
    hover(all(element, '.ct-point')[1]);
    expect(shows(element)).toBe(true);
    expect(textIn(element)).toEqual(['Tue', 'Visitors', '1,500']);
  });

  it('gives points tooltips, but not lines and areas', () => {
    const element = container();
    lineChart(element, week, { showArea: true, plugins: [tooltips()] });
    hover(element.querySelector('.ct-line')!);
    hover(element.querySelector('.ct-area')!);
    expect(shows(element)).toBe(false);
  });

  it('gives every bar and every slice a tooltip', () => {
    const bars = container();
    barChart(bars, week, { plugins: [tooltips()] });
    hover(all(bars, '.ct-bar')[3]);
    expect(textIn(bars)).toEqual(['Thu', 'Visitors', '1,600']);
    const pie = container();
    pieChart(
      pie,
      { labels: ['Apples', 'Kiwis'], series: [20, 10] },
      { plugins: [tooltips()] }
    );
    hover(all(pie, '.ct-slice-pie')[1]);
    expect(textIn(pie)).toEqual(['Kiwis', '10']);
  });

  it('takes other roles, such as a tooltip per line', () => {
    const element = container();
    lineChart(element, week, { plugins: [tooltips({ roles: ['line'] })] });
    hover(all(element, '.ct-point')[0]);
    expect(shows(element)).toBe(false);
    hover(element.querySelector('.ct-line')!);
    expect(textIn(element)).toEqual(['Visitors']);
  });

  it('gives format the label and the value as a number', () => {
    const element = container();
    lineChart(element, week, {
      plugins: [
        tooltips({
          format: item => `${item.label}: ${String(item.value)} visitors`
        })
      ]
    });
    hover(all(element, '.ct-point')[1]);
    expect(textIn(element)).toEqual(['Tue: 1500 visitors']);
  });

  it("gives any role a tooltip, with the node's context for format", () => {
    const element = container();
    lineChart(element, week, {
      layers: { above: [trendLine()] },
      plugins: [
        tooltips({
          roles: ['trendLine'],
          format: item =>
            `${item.seriesName}: ${Number(item.context.slope) > 0 ? 'up' : 'down'}`
        })
      ]
    });
    hover(element.querySelector('.ct-trend-line')!);
    expect(textIn(element)).toEqual(['Visitors: down']);
  });

  it("shows what other roles have: a target line's label and value", () => {
    const element = container();
    lineChart(element, week, {
      layers: { above: [targetLine({ value: 1400, label: 'Goal' })] },
      plugins: [tooltips({ roles: ['targetLine', 'trendLine'] })]
    });
    hover(element.querySelector('.ct-target-line')!);
    expect(textIn(element)).toEqual(['Goal', '1,400']);
    expect(all(element, '.ct-target-line[tabindex]')).toHaveLength(1);
  });

  it('names a trend line by its series, from the data', () => {
    const element = container();
    lineChart(element, week, {
      layers: { above: [trendLine()] },
      plugins: [tooltips({ roles: ['trendLine'] })]
    });
    hover(element.querySelector('.ct-trend-line')!);
    expect(textIn(element)).toEqual(['Visitors']);
  });

  it('keeps the default text where format returns undefined', () => {
    const element = container();
    lineChart(element, week, {
      layers: { above: [trendLine()] },
      plugins: [
        tooltips({
          roles: ['point', 'trendLine'],
          format: item => (item.role === 'trendLine' ? 'Trend' : undefined)
        })
      ]
    });
    hover(element.querySelector('.ct-trend-line')!);
    expect(textIn(element)).toEqual(['Trend']);
    hover(all(element, '.ct-point')[1]);
    expect(textIn(element)).toEqual(['Tue', 'Visitors', '1,500']);
  });

  it('gives roles of custom layers tooltips, without a series too', async () => {
    const { node, chart } = await import('chartist');
    const element = container();
    chart(element, {
      data: { series: [[1, 2]] },
      layers: [
        {
          type: 'peak',
          coordinates: ['cartesian'],
          series: [],
          compose: () => [
            node('circle', { cx: 50, cy: 20, r: 4 }, 'ct-peak', {
              role: 'peak',
              ctx: { label: 'Peak', value: 7, height: 'tall' }
            })
          ]
        }
      ],
      plugins: [
        tooltips({
          roles: ['peak'],
          format: item => `${item.label}: ${String(item.context.height)}`
        })
      ]
    });
    hover(element.querySelector('.ct-peak')!);
    expect(textIn(element)).toEqual(['Peak: tall']);
    expect(element.querySelector('.ct-peak')!.getAttribute('tabindex')).toBe(
      '0'
    );
  });

  it('skips holes', () => {
    const element = container();
    lineChart(
      element,
      { series: [[1, 2, null, 4]] },
      { plugins: [tooltips()] }
    );
    expect(all(element, '[tabindex]')).toHaveLength(3);
  });

  it('adds nothing to scenes and server markup', () => {
    const plain = lineChartConfig(week);
    const withTooltips = { ...plain, plugins: [tooltips()] };
    const size = { width: 600, height: 300 };
    expect(renderForHydration(withTooltips, size)).toBe(
      renderForHydration(plain, size)
    );
    expect(() => toScene(withTooltips, size)).not.toThrow();
  });

  it('sets no style attribute and no HTML from data', () => {
    const element = container();
    lineChart(
      element,
      {
        series: [
          { data: [{ value: 1, meta: '<img src=x onerror=alert(1)>' }, 2] }
        ]
      },
      { plugins: [tooltips()] }
    );
    hover(all(element, '.ct-point')[0]);
    expect(tooltipOf(element).querySelector('img')).toBeNull();
    expect(textIn(element)[0]).toBe('<img src=x onerror=alert(1)>');
    expect(
      tooltipOf(element).style.getPropertyValue('--ct-tooltip-x')
    ).not.toBe('');
  });
});

describe('pointer and touch', () => {
  it('shows on hover and hides on leaving', () => {
    const element = container();
    lineChart(element, week, { plugins: [tooltips()] });
    const point = all(element, '.ct-point')[2];
    hover(point);
    expect(shows(element)).toBe(true);
    leave(point);
    expect(shows(element)).toBe(false);
  });

  it('stays while the pointer is on the tooltip', () => {
    const element = container();
    lineChart(element, week, { plugins: [tooltips()] });
    const point = all(element, '.ct-point')[2];
    hover(point);
    leave(point, tooltipOf(element));
    hover(tooltipOf(element));
    expect(shows(element)).toBe(true);
  });

  it('shows on a tap until a tap elsewhere, and on Escape hides', () => {
    const element = container();
    barChart(element, week, { plugins: [tooltips()] });
    const bar = all(element, '.ct-bar')[1];
    pointer('pointerover', bar, { pointerType: 'touch' });
    expect(shows(element)).toBe(false);
    pointer('pointerdown', bar, { pointerType: 'touch' });
    expect(shows(element)).toBe(true);
    pointer('pointerdown', document.body, { pointerType: 'touch' });
    expect(shows(element)).toBe(false);
    pointer('pointerdown', bar, { pointerType: 'touch' });
    document.body.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })
    );
    expect(shows(element)).toBe(false);
  });

  it('follows the pointer with position: pointer', async () => {
    const element = container();
    lineChart(element, week, {
      plugins: [tooltips({ position: 'pointer' })]
    });
    const point = all(element, '.ct-point')[1];
    const x = () => tooltipOf(element).style.getPropertyValue('--ct-tooltip-x');
    hover(point, { clientX: 120, clientY: 90 });
    expect(x()).toBe('120px');
    // The anchor's place in the tooltip and its side, for a CSS arrow.
    expect(
      tooltipOf(element).style.getPropertyValue('--ct-tooltip-anchor-x')
    ).toBe('0px');
    expect(tooltipOf(element).dataset.placement).toBe('top');
    pointer('pointermove', point, { clientX: 140, clientY: 90 });
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(x()).toBe('140px');
  });

  it('tells an arrow where the value is when the tooltip moved into view', () => {
    // Wider than jsdom's 1024 px viewport: the last point's tooltip is
    // pushed left, and its anchor is right of the tooltip's left edge.
    width = 1400;
    const element = container();
    lineChart(element, week, { plugins: [tooltips()] });
    const point = all(element, '.ct-point')[4];
    hover(point);
    const style = tooltipOf(element).style;
    const x = parseFloat(style.getPropertyValue('--ct-tooltip-x'));
    const anchor = parseFloat(style.getPropertyValue('--ct-tooltip-anchor-x'));
    expect(x).toBe(1024 - 8);
    // The attribute is rounded in the markup.
    expect(x + anchor).toBeCloseTo(Number(point.getAttribute('x1')), 1);
  });

  it('leaves no document or window listener after hiding', () => {
    const added: string[] = [];
    const removed: string[] = [];
    for (const target of [document, window]) {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      vi.spyOn(target, 'addEventListener').mockImplementation(
        (type, listener, options) => {
          added.push(type);
          add(type, listener, options);
        }
      );
      vi.spyOn(target, 'removeEventListener').mockImplementation(
        (type, listener, options) => {
          removed.push(type);
          remove(type, listener, options);
        }
      );
    }
    const element = container();
    lineChart(element, week, { plugins: [tooltips()] });
    const point = all(element, '.ct-point')[0];
    hover(point);
    expect(added.length).toBeGreaterThan(0);
    leave(point);
    // The chart has listeners of its own (print); count the plugin's.
    const own = (types: string[]) =>
      types
        .filter(type =>
          ['scroll', 'resize', 'pointerdown', 'keydown'].includes(type)
        )
        .sort();
    expect(own(added).length).toBeGreaterThan(0);
    expect(own(removed)).toEqual(own(added));
  });
});

describe('render', () => {
  it('fills the content with DOM nodes, named by their text', () => {
    const element = container();
    lineChart(element, week, {
      plugins: [
        tooltips({
          render(content, item) {
            const strong = document.createElement('strong');
            strong.textContent = item.seriesName ?? '';
            const span = document.createElement('span');
            span.textContent = String(item.value);
            content.append(strong, span);
          }
        })
      ]
    });
    const point = all(element, '.ct-point')[0] as HTMLElement;
    point.focus();
    expect(tooltipOf(element).querySelector('strong')!.textContent).toBe(
      'Visitors'
    );
    expect(point.getAttribute('aria-label')).toBe('Visitors 1200');
  });

  it('runs the cleanup before the next render, on hide and on destroy', () => {
    const log: string[] = [];
    const element = container();
    const chart = lineChart(element, week, {
      plugins: [
        tooltips({
          render(content, item) {
            log.push(`mount ${item.valueIndex}`);
            content.textContent = 'component';
            return () => log.push(`unmount ${item.valueIndex}`);
          }
        })
      ]
    });
    const [first, second] = all(element, '.ct-point');
    hover(first);
    hover(second);
    leave(second);
    hover(first);
    chart.destroy();
    expect(log).toEqual([
      'mount 0',
      'unmount 0',
      'mount 1',
      'unmount 1',
      'mount 0',
      'unmount 0'
    ]);
  });

  it('places the tooltip again when its content changes size', async () => {
    const observers: { callback: () => void; observed: Element[] }[] = [];
    vi.stubGlobal(
      'ResizeObserver',
      class {
        observed: Element[] = [];
        callback: () => void;
        constructor(callback: () => void) {
          this.callback = callback;
          observers.push(this);
        }
        observe(target: Element) {
          this.observed.push(target);
        }
        disconnect() {
          this.observed = [];
        }
      }
    );
    const element = container();
    lineChart(element, week, {
      plugins: [
        tooltips({
          render(content) {
            queueMicrotask(() => {
              content.textContent = 'later';
            });
          }
        })
      ]
    });
    const point = all(element, '.ct-point')[0];
    hover(point);
    await Promise.resolve();
    // The chart observes its container too; this one watches the content.
    const content = tooltipOf(element).querySelector('.ct-tooltip-content')!;
    const observer = observers.find(candidate =>
      candidate.observed.includes(content)
    )!;
    expect(observer.observed).toEqual([content]);
    const setProperty = vi.spyOn(tooltipOf(element).style, 'setProperty');
    observer.callback();
    expect(setProperty).toHaveBeenCalledWith(
      '--ct-tooltip-x',
      expect.any(String)
    );
    leave(point);
    expect(observer.observed).toEqual([]);
  });

  it('lets format decide which values show and name them', () => {
    const render = vi.fn((content: HTMLElement) => {
      content.textContent = 'rich';
    });
    const element = container();
    lineChart(element, week, {
      plugins: [
        tooltips({
          format: (item: TooltipItem) =>
            item.valueIndex === 0 ? null : `${item.label} visitors`,
          render
        })
      ]
    });
    const [first, second] = all(element, '.ct-point') as HTMLElement[];
    hover(first);
    expect(shows(element)).toBe(false);
    second.focus();
    expect(render).toHaveBeenCalledTimes(1);
    expect(second.getAttribute('aria-label')).toBe('Tue visitors');
  });
});

describe('keyboard', () => {
  const three = {
    series: [1, 2, 3].map(series =>
      Array.from({ length: 10 }, (_, index) => series * 10 + index)
    )
  };

  it('makes the chart one tab stop that shows and hides the tooltip', () => {
    const element = container();
    lineChart(element, three, { plugins: [tooltips()] });
    const stops = all(element, '[tabindex="0"]');
    expect(stops).toEqual([all(element, '.ct-point')[0]]);
    expect(all(element, '[tabindex="-1"]')).toHaveLength(29);
    (stops[0] as HTMLElement).focus();
    expect(shows(element)).toBe(true);
    const after = document.createElement('button');
    document.body.append(after);
    after.focus();
    expect(shows(element)).toBe(false);
  });

  it('moves with the arrow keys, and the tooltip follows', () => {
    const element = container();
    lineChart(element, three, { plugins: [tooltips()] });
    const points = all(element, '.ct-point') as HTMLElement[];
    points[0].focus();
    key(points[0], 'ArrowRight');
    expect(document.activeElement).toBe(points[1]);
    key(points[1], 'ArrowDown');
    expect(document.activeElement).toBe(points[11]);
    expect(textIn(element)).toEqual(['21']);
    expect(all(element, '[tabindex="0"]')).toEqual([points[11]]);
  });

  it('moves between slices', () => {
    const element = container();
    pieChart(element, { series: [3, 2, 1] }, { plugins: [tooltips()] });
    const slices = all(element, '.ct-slice-pie') as HTMLElement[];
    slices[0].focus();
    key(slices[0], 'ArrowRight');
    expect(document.activeElement).toBe(slices[1]);
  });

  it('hides on Escape and keeps the focus', () => {
    const element = container();
    lineChart(element, week, { plugins: [tooltips()] });
    const point = all(element, '.ct-point')[0] as HTMLElement;
    point.focus();
    key(point, 'Escape');
    expect(shows(element)).toBe(false);
    expect(document.activeElement).toBe(point);
  });

  it('leaves the elements alone with keyboard: false', () => {
    const element = container();
    lineChart(element, week, { plugins: [tooltips({ keyboard: false })] });
    expect(all(element, '[tabindex]')).toEqual([]);
    expect(all(element, '[role], [aria-label]')).toEqual([]);
  });

  it('names the focused value with the tooltip text', () => {
    const element = container();
    barChart(
      element,
      {
        labels: ['Q1', 'Q2', 'Q3'],
        series: [{ name: 'Sales', data: [3, 4, 5] }]
      },
      { plugins: [tooltips()] }
    );
    const bars = all(element, '.ct-bar') as HTMLElement[];
    expect(bars[0].getAttribute('role')).toBe('img');
    expect(bars[0].getAttribute('aria-label')).toBe('Q1, Sales, 3');
    bars[0].focus();
    key(bars[0], 'ArrowRight');
    expect(bars[1].getAttribute('aria-label')).toBe('Q2, Sales, 4');
    expect(tooltipOf(element).getAttribute('aria-hidden')).toBe('true');
  });

  it("keeps the svg's own role and name", () => {
    const element = container();
    lineChart(element, week, {
      plugins: [tooltips()],
      renderer: liveDomRenderer()
    });
    const svg = element.querySelector('svg')!;
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Visitors this week');
    (all(element, '.ct-point')[0] as HTMLElement).focus();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Visitors this week');
  });
});

describe('across renders', () => {
  it('moves with a live update, in step with its animation', () => {
    vi.stubGlobal('matchMedia', () => ({
      matches: false,
      addEventListener: () => undefined,
      removeEventListener: () => undefined
    }));
    const animate = vi.fn();
    HTMLElement.prototype.animate = animate;
    let animation: UpdateAnimation | undefined;
    const element = container();
    const chart = lineChart(element, week, {
      plugins: [tooltips()],
      renderer: liveDomRenderer({ animations: smilAnimations() }),
      on: {
        mount: (event: PhaseEvents['mount']) => {
          animation = event.animation;
        }
      }
    });
    const point = all(element, '.ct-point')[2];
    hover(point);
    chart.update({
      data: {
        ...week,
        series: [{ name: 'Visitors', data: [1200, 1500, 1900, 1600, 1100] }]
      }
    });
    expect(all(element, '.ct-point')[2]).toBe(point);
    expect(textIn(element)).toEqual(['Wed', 'Visitors', '1,900']);
    if (animation) {
      expect(animate).toHaveBeenCalledWith(expect.anything(), animation);
    }
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
  });

  it('keeps the focus on a replaced element with the default renderer', () => {
    const element = container();
    const chart = lineChart(element, week, { plugins: [tooltips()] });
    const points = all(element, '.ct-point') as HTMLElement[];
    points[0].focus();
    key(points[0], 'ArrowRight');
    key(points[1], 'ArrowRight');
    chart.update({
      data: { ...week, series: [{ name: 'Visitors', data: [1, 2, 3, 4, 5] }] }
    });
    const third = all(element, '.ct-point')[2];
    expect(third).not.toBe(points[2]);
    expect(document.activeElement).toBe(third);
    expect(textIn(element)).toEqual(['Wed', 'Visitors', '3']);
  });

  it('hides when the value is gone', () => {
    const element = container();
    const chart = lineChart(element, week, { plugins: [tooltips()] });
    hover(all(element, '.ct-point')[4]);
    chart.update({ data: { labels: ['Mon', 'Tue'], series: [[1, 2]] } });
    expect(shows(element)).toBe(false);
  });

  it('moves to the value on a resize', () => {
    const element = container();
    const chart = lineChart(element, week, { plugins: [tooltips()] });
    hover(all(element, '.ct-point')[4]);
    const x = () => tooltipOf(element).style.getPropertyValue('--ct-tooltip-x');
    const before = x();
    width = 600;
    chart.update({});
    expect(x()).not.toBe(before);
  });

  it('takes server markup over with tooltips and the tab stop', () => {
    const element = container(
      renderForHydration(lineChartConfig(week), { width: 400, height: 200 })
    );
    const svg = element.querySelector('svg');
    lineChart(element, week, {
      plugins: [tooltips()],
      renderer: liveDomRenderer()
    });
    expect(element.querySelector('svg')).toBe(svg);
    expect(all(element, '[tabindex="0"]')).toHaveLength(1);
    hover(all(element, '.ct-point')[1]);
    expect(textIn(element)).toEqual(['Tue', 'Visitors', '1,500']);
  });

  it('stays cheap over many live updates', () => {
    const format = vi.fn((item: TooltipItem) => String(item.valueIndex));
    const element = container();
    const chart = lineChart(element, week, {
      plugins: [tooltips({ format })],
      renderer: liveDomRenderer()
    });
    for (let index = 0; index < 100; index++) {
      chart.update({
        data: { ...week, series: [[1, 2, 3 + (index % 7), 4, 5]] }
      });
    }
    format.mockClear();
    hover(all(element, '.ct-point')[1]);
    expect(format).toHaveBeenCalledTimes(1);
    for (const point of all(element, '.ct-point')) {
      const classes = point.getAttribute('class')!.split(' ');
      expect(classes.filter(name => name === 'ct-tooltip-target')).toHaveLength(
        1
      );
    }
  });
});

describe('cleanup', () => {
  it('removes the tooltip and its listeners on destroy', () => {
    const removed: string[] = [];
    const remove = document.removeEventListener.bind(document);
    vi.spyOn(document, 'removeEventListener').mockImplementation(
      (type, listener, options) => {
        removed.push(type);
        remove(type, listener, options);
      }
    );
    const element = container();
    const chart = lineChart(element, week, { plugins: [tooltips()] });
    hover(all(element, '.ct-point')[0]);
    chart.destroy();
    expect(document.querySelector('.ct-tooltip')).toBeNull();
    expect(removed).toEqual(expect.arrayContaining(['pointerdown', 'keydown']));
  });

  it('keeps working after detach', () => {
    const element = container();
    const chart = lineChart(element, week, { plugins: [tooltips()] });
    chart.detach();
    hover(all(element, '.ct-point')[0]);
    expect(shows(element)).toBe(true);
  });

  it('keeps two charts apart', () => {
    const first = container();
    const second = container();
    lineChart(first, week, { plugins: [tooltips()] });
    barChart(second, week, { plugins: [tooltips()] });
    const point = all(first, '.ct-point')[0];
    const bar = all(second, '.ct-bar')[0];
    hover(point);
    leave(point, bar);
    hover(bar);
    expect(shows(first)).toBe(false);
    expect(shows(second)).toBe(true);
    expect(tooltipOf(first).id).not.toBe(tooltipOf(second).id);
  });
});
