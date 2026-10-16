import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  findAll,
  node,
  pieChartConfig,
  renderElement,
  toScene,
  type Keyframes,
  type RenderCause,
  type SceneChange,
  type SceneNode
} from '../index';
import { smilAnimations } from './animations';
import type { LiveAnimationContext } from './types';

interface Setup {
  readonly cause?: RenderCause;
  readonly duration?: string;
  readonly easing?: string;
  readonly keyframes?: LiveAnimationContext['update']['keyframes'];
}

/**
 * Animates the update of one node, its element built from the new node,
 * and returns the timing and the element.
 */
function animate(
  previous: SceneNode,
  next: SceneNode,
  setup: Setup = {},
  scenes: { previous: SceneNode; next: SceneNode } = {
    previous: node('svg'),
    next: node('svg')
  }
) {
  const {
    cause = 'update',
    duration = 'duration' in setup ? setup.duration : '400ms',
    easing,
    keyframes = () => undefined
  } = setup;
  const element = renderElement(next, document);
  document.body.append(element);
  const styles: Record<string, string | undefined> = {
    '--ct-update-duration': duration,
    '--ct-update-easing': easing
  };
  const changes: SceneChange[] = [{ op: 'update', node: next, previous }];
  const context: LiveAnimationContext = {
    changes,
    elementOf: current => (current === next ? element : undefined),
    update: {
      previous: {},
      previousScene: scenes.previous,
      cause,
      labels: [],
      previousLabels: [],
      keyframes
    },
    container: document.body,
    scene: scenes.next,
    measureStyle: property => styles[property],
    valueKey: ({ valueIndex }) => String(valueIndex)
  };
  const timing = smilAnimations().animate(context);
  return { timing, element, context };
}

const animationsOf = (element: Element) =>
  Array.from(element.querySelectorAll('animate'));

const attributesOf = (element: Element) =>
  Object.fromEntries(
    Array.from(element.attributes).map(({ name, value }) => [name, value])
  );

const bar = (y2: number): SceneNode =>
  node('line', { x1: 10, x2: 10, y1: 300, y2 }, 'ct-bar');

afterEach(() => {
  document.body.innerHTML = '';
  vi.unstubAllGlobals();
});

describe('smilAnimations() timing', () => {
  it.each([
    ['400ms', 400],
    ['0.4s', 400],
    ['1.5s', 1500],
    [' 250ms ', 250]
  ])('reads a duration of %s', (duration, ms) => {
    const { timing } = animate(bar(100), bar(200), { duration });
    expect(timing).toEqual({ duration: ms, easing: 'ease-out' });
  });

  it.each([['0s'], ['0ms']])(
    "doesn't animate with a duration of %j",
    duration => {
      const { timing, element } = animate(bar(100), bar(200), { duration });
      expect(timing).toBeUndefined();
      expect(animationsOf(element)).toHaveLength(0);
    }
  );

  it.each([[''], ['fast'], ['400'], [undefined]])(
    'animates 300 ms with ease-out for a duration of %j',
    duration => {
      const { timing, element } = animate(bar(100), bar(200), {
        duration,
        easing: undefined
      });
      expect(timing).toEqual({ duration: 300, easing: 'ease-out' });
      expect(animationsOf(element)).toHaveLength(1);
    }
  );

  it.each([['create'], ['resize'], ['fonts']] as const)(
    "doesn't animate a render with cause %s",
    cause => {
      const { timing, element } = animate(bar(100), bar(200), { cause });
      expect(timing).toBeUndefined();
      expect(animationsOf(element)).toHaveLength(0);
    }
  );

  it.each([['update'], ['responsive']] as const)(
    'animates a render with cause %s',
    cause => {
      const { timing, element } = animate(bar(100), bar(200), { cause });
      expect(timing).toEqual({ duration: 400, easing: 'ease-out' });
      expect(animationsOf(element)).toHaveLength(1);
    }
  );

  it("doesn't animate while reduced motion is asked for", () => {
    const matchMedia = vi.fn((query: string) => ({
      matches: query === '(prefers-reduced-motion: reduce)'
    }));
    vi.stubGlobal('matchMedia', matchMedia);
    const { timing, element } = animate(bar(100), bar(200));
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    expect(timing).toBeUndefined();
    expect(animationsOf(element)).toHaveLength(0);
  });

  it('animates when reduced motion is not asked for', () => {
    vi.stubGlobal('matchMedia', () => ({ matches: false }));
    expect(animate(bar(100), bar(200)).timing).toBeDefined();
  });

  it("animates with the defaults without a way to read the chart's CSS", () => {
    const { context, element } = animate(bar(100), bar(200), {
      cause: 'create'
    });
    expect(
      smilAnimations().animate({
        ...context,
        update: { ...context.update, cause: 'update' },
        measureStyle: undefined
      })
    ).toEqual({ duration: 300, easing: 'ease-out' });
    expect(animationsOf(element)).toHaveLength(1);
  });

  it('reads the CSS with the root classes, in the container', () => {
    const measureStyle = vi.fn(() => '300ms');
    const { context } = animate(bar(100), bar(200), { cause: 'create' });
    smilAnimations().animate({
      ...context,
      update: { ...context.update, cause: 'update' },
      scene: node('svg', {}, 'ct-chart-line ct-live'),
      measureStyle
    });
    expect(measureStyle).toHaveBeenCalledWith('--ct-update-duration', {
      container: document.body,
      rootClass: 'ct-chart-line ct-live'
    });
  });

  it.each([
    ['ease-out', 'ease-out'],
    ['linear', 'linear'],
    ['cubic-bezier(0.34, 1.56, 0.64, 1)', 'cubic-bezier(0.34, 1.56, 0.64, 1)'],
    ['steps(4, end)', 'steps(4, end)'],
    ['linear(0, 0.8, 1)', 'linear(0, 0.8, 1)'],
    ['bouncy', 'ease-out'],
    ['easeOutBack', 'ease-out']
  ])('returns the easing %s as %s', (easing, expected) => {
    expect(animate(bar(100), bar(200), { easing }).timing).toEqual({
      duration: 400,
      easing: expected
    });
  });

  it('returns the timing also when no attribute animates', () => {
    const { timing, element } = animate(bar(100), bar(100));
    expect(timing).toEqual({ duration: 400, easing: 'ease-out' });
    expect(animationsOf(element)).toHaveLength(0);
  });
});

describe('smilAnimations() numbers and paths', () => {
  it('animates a changed number as an offset with keySplines', () => {
    const { element } = animate(bar(100), bar(200), { easing: 'ease-out' });
    const [animation] = animationsOf(element);
    expect(attributesOf(animation)).toEqual({
      class: 'ct-update-animation',
      attributeName: 'y2',
      begin: 'indefinite',
      dur: '400ms',
      fill: 'remove',
      values: '-100;0',
      keyTimes: '0;1',
      calcMode: 'spline',
      keySplines: '0 0 0.58 1',
      additive: 'sum'
    });
    // The attribute holds the new value from the start.
    expect(element.getAttribute('y2')).toBe('200');
  });

  it('samples an easing that overshoots into offset frames', () => {
    const { element } = animate(bar(100), bar(200), {
      easing: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
    });
    const [animation] = animationsOf(element);
    const values = animation.getAttribute('values')!.split(';').map(Number);
    expect(values).toHaveLength(12);
    expect(values[0]).toBe(-100);
    expect(values[11]).toBe(0);
    // Drawn past 200 before it settles.
    expect(Math.max(...values)).toBeGreaterThan(0);
    expect(animation.getAttribute('keyTimes')!.split(';')).toHaveLength(12);
    expect(animation.getAttribute('calcMode')).toBe('linear');
    expect(animation.hasAttribute('keySplines')).toBe(false);
    expect(animation.getAttribute('additive')).toBe('sum');
  });

  it('samples steps() as discrete frames', () => {
    const { element } = animate(bar(100), bar(200), { easing: 'steps(4)' });
    const [animation] = animationsOf(element);
    expect(animation.getAttribute('calcMode')).toBe('discrete');
    expect(
      new Set(animation.getAttribute('values')!.split(';')).size
    ).toBeLessThanOrEqual(5);
  });

  it('animates only the attributes that changed, and no data attributes', () => {
    const previous = node('line', { x1: 1, y1: 2, 'ct:value': 3 });
    const next = node('line', { x1: 1, y1: 5, 'ct:value': 6 });
    const { element } = animate(previous, next);
    expect(
      animationsOf(element).map(animation =>
        animation.getAttribute('attributeName')
      )
    ).toEqual(['y1']);
  });

  it("doesn't animate attributes that aren't numbers", () => {
    const { element } = animate(
      node('text', { 'text-anchor': 'start', x: 10 }),
      node('text', { 'text-anchor': 'end', x: 10 })
    );
    expect(animationsOf(element)).toHaveLength(0);
  });

  it('animates a path with the same commands as an offset', () => {
    const { element } = animate(
      node('path', { d: 'M0,0L10,10' }),
      node('path', { d: 'M0,10L10,20' }),
      { easing: 'linear' }
    );
    const [animation] = animationsOf(element);
    expect(animation.getAttribute('attributeName')).toBe('d');
    expect(animation.getAttribute('values')).toBe('M0,-10L0,-10;M0,0L0,0');
    expect(animation.getAttribute('additive')).toBe('sum');
    expect(element.getAttribute('d')).toBe('M0,10L10,20');
  });

  it('compares paths with relative commands as absolute ones', () => {
    const { element } = animate(
      node('path', { d: 'M0,0l10,10' }),
      node('path', { d: 'M0,10L10,20' }),
      { easing: 'linear' }
    );
    expect(animationsOf(element)[0].getAttribute('values')).toBe(
      'M0,-10L0,-10;M0,0L0,0'
    );
  });

  it('animates the values of a new path with relative commands', () => {
    const { element } = animate(
      node('path', { d: 'M0,0L10,10' }),
      node('path', { d: 'M0,10l10,10' }),
      { easing: 'linear' }
    );
    const [animation] = animationsOf(element);
    expect(animation.getAttribute('values')).toBe('M0,0L10,10;M0,10L10,20');
    expect(animation.hasAttribute('additive')).toBe(false);
  });

  it.each([
    ['a vertex more', 'M0,0L10,10', 'M0,0L10,10L20,0'],
    ['a line that became a curve', 'M0,0L10,10', 'M0,0C1,1,9,9,10,10'],
    ['an arc', 'M0,0A5,5,0,0,0,10,0', 'M0,0A5,5,0,1,0,20,0']
  ])("doesn't animate a path with %s", (_, from, to) => {
    const { element } = animate(
      node('path', { d: from }),
      node('path', { d: to })
    );
    expect(animationsOf(element)).toHaveLength(0);
    expect(element.getAttribute('d')).toBe(to);
  });

  it('starts each animation and removes it when it ends', () => {
    const beginElement = vi.fn();
    Object.defineProperty(SVGElement.prototype, 'beginElement', {
      value: beginElement,
      configurable: true
    });
    try {
      const { element } = animate(bar(100), bar(200));
      const [animation] = animationsOf(element);
      expect(beginElement).toHaveBeenCalledTimes(1);
      animation.dispatchEvent(new Event('endEvent'));
      expect(animationsOf(element)).toHaveLength(0);
    } finally {
      delete (SVGElement.prototype as { beginElement?: unknown }).beginElement;
    }
  });

  it('removes ended animations of an element on the next update', () => {
    const { element, context } = animate(bar(100), bar(200));
    const [ended] = animationsOf(element);
    const timing = (start: number) => ({
      getStartTime: () => start,
      getSimpleDuration: () => 0.4,
      getCurrentTime: () => 1
    });
    Object.assign(ended, timing(0));
    const running = ended.cloneNode() as Element;
    Object.assign(running, timing(0.8));
    element.append(running);
    const stopped = ended.cloneNode() as Element;
    Object.assign(stopped, {
      getStartTime: () => {
        throw new Error('No current interval');
      }
    });
    element.append(stopped);
    const foreign = document.createElementNS(
      'http://www.w3.org/2000/svg',
      'animate'
    );
    element.append(foreign);

    smilAnimations().animate({
      ...context,
      changes: [{ op: 'update', node: bar(300), previous: bar(200) }],
      elementOf: () => element
    });
    const left = animationsOf(element);
    expect(left).toContain(running);
    expect(left).toContain(foreign);
    expect(left).not.toContain(ended);
    expect(left).not.toContain(stopped);
    expect(left).toHaveLength(3);
  });

  it('leaves animations alone where SMIL timing is missing', () => {
    const { element, context } = animate(bar(100), bar(200));
    smilAnimations().animate({
      ...context,
      changes: [{ op: 'update', node: bar(300), previous: bar(200) }],
      elementOf: () => element
    });
    expect(animationsOf(element)).toHaveLength(2);
  });

  it('skips added and removed nodes and nodes without an element', () => {
    const { context } = animate(bar(100), bar(200), { cause: 'create' });
    const element = renderElement(bar(200), document);
    expect(
      smilAnimations().animate({
        ...context,
        update: { ...context.update, cause: 'update' },
        changes: [
          { op: 'add', node: bar(200) },
          { op: 'remove', node: bar(100) },
          { op: 'update', node: bar(300), previous: bar(100) }
        ],
        elementOf: () => undefined
      })
    ).toBeDefined();
    expect(animationsOf(element)).toHaveLength(0);
  });
});

describe('smilAnimations() keyframes', () => {
  const path = (d: string): SceneNode => node('path', { d }, 'ct-custom');

  it("asks for a node's keyframes with the easing's progress points", () => {
    const frames: Keyframes = Array.from({ length: 12 }, (_, index) => ({
      d: `M0,${index}L10,${index}L20,${index}`
    }));
    const keyframes = vi.fn(() => frames);
    const previous = path('M0,0L10,0');
    const next = path('M0,11L10,11L20,11');
    const { element } = animate(previous, next, {
      keyframes,
      easing: 'ease-in'
    });
    expect(keyframes).toHaveBeenCalledWith(previous, next, expect.any(Array));
    const progress = (keyframes.mock.calls[0] as unknown[])[2] as number[];
    expect(progress).toHaveLength(12);
    expect(progress[0]).toBe(0);
    expect(progress[11]).toBe(1);

    // A custom layer's path gains a vertex, through its keyframes, written
    // as offsets from the new path.
    const [animation] = animationsOf(element);
    const values = animation.getAttribute('values')!.split(';');
    expect(values).toHaveLength(12);
    expect(values[0]).toBe('M0,-11L0,-11L0,-11');
    expect(values[11]).toBe('M0,0L0,0L0,0');
    expect(animation.getAttribute('additive')).toBe('sum');
    expect(animation.getAttribute('calcMode')).toBe('linear');
    expect(animation.hasAttribute('keySplines')).toBe(false);
  });

  it('writes frames of another shape as they are', () => {
    const frames: Keyframes = Array.from({ length: 12 }, (_, index) => ({
      d: index < 6 ? 'M0,0L10,0' : 'M0,0L10,0L20,0'
    }));
    const { element } = animate(path('M0,0L10,0'), path('M0,0L10,0L20,0'), {
      keyframes: () => frames
    });
    const [animation] = animationsOf(element);
    expect(animation.getAttribute('values')).toBe(
      frames.map(frame => frame.d).join(';')
    );
    expect(animation.hasAttribute('additive')).toBe(false);
  });

  it("animates a plugin's own node through its keyframes", () => {
    const needle = (angle: number) =>
      node('path', { d: `M50,50L${angle},0` }, 'ct-needle', { key: 'needle' });
    const keyframes = vi.fn((_: SceneNode, next: SceneNode) =>
      next.key === 'needle'
        ? Array.from({ length: 12 }, () => ({ d: 'M50,50L75,0' }))
        : undefined
    );
    const { element } = animate(needle(10), needle(90), { keyframes });
    expect(animationsOf(element)[0].getAttribute('values')).toBe(
      Array(12).fill('M0,0L-15,0').join(';')
    );
  });

  it('animates number by number where the keyframes give nothing', () => {
    const keyframes = vi.fn(() => undefined);
    const { element } = animate(bar(100), bar(200), {
      keyframes,
      easing: 'ease-out'
    });
    expect(keyframes).toHaveBeenCalledTimes(1);
    expect(animationsOf(element)[0].getAttribute('values')).toBe('-100;0');
  });

  it('animates the attributes the keyframes leave out number by number', () => {
    const keyframes = () =>
      Array.from({ length: 12 }, (_, index) => ({ y2: 100 + index }));
    const previous = node('line', { x1: 0, y2: 100 });
    const next = node('line', { x1: 10, y2: 111 });
    const { element } = animate(previous, next, {
      keyframes,
      easing: 'linear'
    });
    const byName = Object.fromEntries(
      animationsOf(element).map(animation => [
        animation.getAttribute('attributeName'),
        animation.getAttribute('values')
      ])
    );
    expect(byName.x1).toBe('-10;0');
    expect(byName.y2!.split(';')[0]).toBe('-11');
  });

  it("doesn't ask for keyframes of a node whose attributes didn't change", () => {
    const keyframes = vi.fn(() => undefined);
    animate(bar(100), bar(100), { keyframes });
    expect(keyframes).not.toHaveBeenCalled();
  });

  describe('of pie slices', () => {
    const pieScene = (values: number[]) =>
      toScene(pieChartConfig({ series: values }), {
        width: 400,
        height: 200
      });
    const previousScene = pieScene([10, 90]);
    const nextScene = pieScene([60, 40]);
    const [from] = findAll(previousScene, { role: 'slice' });
    const [to] = findAll(nextScene, { role: 'slice' });
    const scenes = { previous: previousScene, next: nextScene };

    it('turns slices with the built-in keyframes, as frames', () => {
      const { element } = animate(from, to, {}, scenes);
      const [animation] = animationsOf(element);
      const values = animation.getAttribute('values')!.split(';');
      expect(values).toHaveLength(12);
      expect(values[0]).toBe(from.attrs.d);
      expect(values[11]).toBe(to.attrs.d);
      expect(animation.hasAttribute('additive')).toBe(false);
    });

    it("uses a plugin's keyframes for slices instead", () => {
      const grow = Array.from({ length: 12 }, () => ({
        d: String(to.attrs.d)
      }));
      const { element } = animate(
        from,
        to,
        { keyframes: (_, next) => (next.role === 'slice' ? grow : undefined) },
        scenes
      );
      const [animation] = animationsOf(element);
      expect(animation.getAttribute('values')).toBe(
        grow.map(frame => frame.d).join(';')
      );
    });

    it('moves pie labels around the pie as offsets', () => {
      const [fromLabel] = findAll(previousScene, { role: 'label' });
      const [toLabel] = findAll(nextScene, { role: 'label' });
      const { element } = animate(fromLabel, toLabel, {}, scenes);
      const names = animationsOf(element).map(animation => [
        animation.getAttribute('attributeName'),
        animation.getAttribute('additive'),
        animation.getAttribute('values')!.split(';').length
      ]);
      expect(names).toEqual([
        ['dx', 'sum', 12],
        ['dy', 'sum', 12]
      ]);
    });
  });
});
