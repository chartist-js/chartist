import type { EventEmitter } from '../event';
import { ensureUnit, quantity } from '../core/lang';
import type { Attributes, AnimationDefinition, AnimationEvent } from './types';
import type { Svg } from './Svg';

/**
 * The named easing curves for {@link Svg.animate}, from `easeInSine` to
 * `easeInOutBack`: each the four numbers of a cubic Bézier curve. Name one
 * as an animation's `easing`, or pass four numbers of your own, such as
 * `easing: [0.25, 0.1, 0.25, 1]`.
 *
 * @example
 * ```ts
 * import { lineChart, findAll, Svg, type ChartPlugin } from 'chartist';
 *
 * // Points drop in from the top and bounce a little at the end.
 * const dropIn: ChartPlugin = {
 *   name: 'drop-in',
 *   install(chart) {
 *     chart.on('mount', ({ scene, elementOf }) => {
 *       for (const point of findAll(scene, { role: 'point' })) {
 *         const element = elementOf(point);
 *         const { y } = point.ctx;
 *         if (element) {
 *           new Svg(element).animate({
 *             y1: { dur: 600, from: 0, to: y, easing: 'easeOutBack' },
 *             y2: { dur: 600, from: 0, to: y, easing: 'easeOutBack' }
 *           });
 *         }
 *       }
 *     });
 *   }
 * };
 *
 * lineChart('#chart', { series: [[5, 2, 4, 3]] }, { plugins: [dropIn] });
 * ```
 */
export const easings = {
  easeInSine: [0.47, 0, 0.745, 0.715],
  easeOutSine: [0.39, 0.575, 0.565, 1],
  easeInOutSine: [0.445, 0.05, 0.55, 0.95],
  easeInQuad: [0.55, 0.085, 0.68, 0.53],
  easeOutQuad: [0.25, 0.46, 0.45, 0.94],
  easeInOutQuad: [0.455, 0.03, 0.515, 0.955],
  easeInCubic: [0.55, 0.055, 0.675, 0.19],
  easeOutCubic: [0.215, 0.61, 0.355, 1],
  easeInOutCubic: [0.645, 0.045, 0.355, 1],
  easeInQuart: [0.895, 0.03, 0.685, 0.22],
  easeOutQuart: [0.165, 0.84, 0.44, 1],
  easeInOutQuart: [0.77, 0, 0.175, 1],
  easeInQuint: [0.755, 0.05, 0.855, 0.06],
  easeOutQuint: [0.23, 1, 0.32, 1],
  easeInOutQuint: [0.86, 0, 0.07, 1],
  easeInExpo: [0.95, 0.05, 0.795, 0.035],
  easeOutExpo: [0.19, 1, 0.22, 1],
  easeInOutExpo: [1, 0, 0, 1],
  easeInCirc: [0.6, 0.04, 0.98, 0.335],
  easeOutCirc: [0.075, 0.82, 0.165, 1],
  easeInOutCirc: [0.785, 0.135, 0.15, 0.86],
  easeInBack: [0.6, -0.28, 0.735, 0.045],
  easeOutBack: [0.175, 0.885, 0.32, 1.275],
  easeInOutBack: [0.68, -0.55, 0.265, 1.55]
};

/** The CSS easing keywords as cubic Bézier curves. */
const CSS_EASINGS: Readonly<Record<string, readonly number[]>> = {
  linear: [0, 0, 1, 1],
  ease: [0.25, 0.1, 0.25, 1],
  'ease-in': [0.42, 0, 1, 1],
  'ease-out': [0, 0, 0.58, 1],
  'ease-in-out': [0.42, 0, 0.58, 1]
};

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

/** The four numbers of a cubic Bézier easing, or nothing for other easings. */
function curveOf(easing: string): readonly number[] | undefined {
  const css = easing.trim();
  if (CSS_EASINGS[css]) {
    return CSS_EASINGS[css];
  }
  if (easings[css as keyof typeof easings]) {
    return easings[css as keyof typeof easings];
  }
  const numbers = css.startsWith('cubic-bezier(') ? css.match(NUMBER) : null;
  return numbers?.length === 4 ? numbers.map(Number) : undefined;
}

/** A cubic Bézier easing as a function of time, solved for x by bisection. */
function bezier([x1, y1, x2, y2]: readonly number[]) {
  const at = (a: number, b: number, t: number) =>
    3 * a * t * (1 - t) ** 2 + 3 * b * t ** 2 * (1 - t) + t ** 3;
  return (time: number) => {
    let low = 0;
    let high = 1;
    let t = time;
    for (let i = 0; i < 30; i++) {
      const x = at(x1, x2, t);
      if (Math.abs(x - time) < 1e-6) {
        break;
      }
      if (x < time) {
        low = t;
      } else {
        high = t;
      }
      t = (low + high) / 2;
    }
    return at(y1, y2, t);
  };
}

/** `steps(n, position)` as a function of time. */
function steps(css: string) {
  const count = Math.max(1, Math.round(Number(css.match(NUMBER)?.[0] ?? 1)));
  const position =
    css.match(/(jump-)?(start|end|none|both)\s*\)/)?.[2] ?? 'end';
  const jumps =
    position === 'none' ? count - 1 : position === 'both' ? count + 1 : count;
  const offset = position === 'start' || position === 'both' ? 1 : 0;
  return (time: number) =>
    Math.min(
      1,
      (Math.min(Math.floor(time * count), count - 1) + offset) /
        Math.max(1, jumps)
    );
}

/** `linear(…)` as a function of time: its stops, evenly spread where not given. */
function linearStops(css: string) {
  const stops = css
    .slice(css.indexOf('(') + 1, css.lastIndexOf(')'))
    .split(',')
    .map(stop => stop.trim().split(/\s+/).map(parseFloat));
  const ys = stops.map(([value]) => value);
  const xs = stops.map(([, at], index) =>
    at === undefined || Number.isNaN(at)
      ? index / Math.max(1, stops.length - 1)
      : at / 100
  );
  return (time: number) => {
    let i = 1;
    while (i < xs.length - 1 && time > xs[i]) {
      i++;
    }
    const span = xs[i] - xs[i - 1] || 1;
    return ys[i - 1] + ((ys[i] - ys[i - 1]) * (time - xs[i - 1])) / span;
  };
}

/** An easing as a function of time, `ease` for easings it doesn't know. */
function easingFunction(easing: string | readonly number[]) {
  if (typeof easing !== 'string') {
    return bezier(easing);
  }
  const css = easing.trim();
  if (css.startsWith('steps(')) {
    return steps(css);
  }
  if (css.startsWith('linear(')) {
    return linearStops(css);
  }
  return bezier(curveOf(css) ?? CSS_EASINGS.ease);
}

/**
 * The SMIL `keySplines` of an easing SMIL can express: a cubic Bézier
 * curve whose four numbers lie within 0 and 1 (the CSS keywords, many
 * `cubic-bezier()` curves, most names of {@link easings}). Browsers ignore
 * an animation whose `keySplines` leave that range, so for other easings
 * it returns nothing: sample them with {@link sampleEasing} instead.
 *
 * @example
 * ```ts
 * import { keySplinesOf } from 'chartist';
 *
 * keySplinesOf('ease-out'); // '0 0 0.58 1'
 * keySplinesOf('easeOutBack'); // undefined: it overshoots
 * ```
 * @param easing A CSS easing, a name of {@link easings}, or four numbers
 * @returns The `keySplines` value, or nothing
 * @experimental
 */
export function keySplinesOf(
  easing: string | readonly number[]
): string | undefined {
  const curve = typeof easing === 'string' ? curveOf(easing) : easing;
  return curve?.length === 4 && curve.every(value => value >= 0 && value <= 1)
    ? curve.join(' ')
    : undefined;
}

/**
 * The eased progress of an animation at evenly spaced times, for SMIL
 * `values` with even `keyTimes`: 12 points, and one per 50 ms for
 * animations longer than 600 ms, at most 40. It takes the CSS easings
 * (the keywords, `cubic-bezier()` curves, also ones that overshoot,
 * `linear()` and `steps()`), the names of {@link easings} and four
 * numbers of a cubic Bézier curve; anything else is sampled as `ease`.
 * Points lie below 0 or above 1 where the easing overshoots.
 *
 * @example
 * ```ts
 * import { sampleEasing } from 'chartist';
 *
 * // A value that grows from 10 to 20 and overshoots a little on the way.
 * const progress = sampleEasing('cubic-bezier(0.34, 1.56, 0.64, 1)', 400);
 * const values = progress.map(p => 10 + (20 - 10) * p).join(';');
 * ```
 * @param easing The easing
 * @param duration The animation's duration in ms
 * @returns The progress at each point, from 0 to 1
 * @experimental
 */
export function sampleEasing(
  easing: string | readonly number[],
  duration: number
): number[] {
  const count =
    duration > 600 ? Math.min(40, Math.max(12, Math.round(duration / 50))) : 12;
  const at = easingFunction(easing);
  return Array.from({ length: count }, (_, index) => {
    const time = index / (count - 1);
    return index === 0 ? 0 : index === count - 1 ? 1 : at(time);
  });
}

/**
 * The value between `from` and `to` at `progress`: the numbers in `to`
 * moved from their counterparts in `from`, when both have the same shape
 * (`10px` and `40px`, two paths with the same commands), else `from`
 * until halfway and `to` after.
 */
function between(from: string, to: string, progress: number): string {
  const fromNumbers = from.match(NUMBER) ?? [];
  const toNumbers = to.match(NUMBER) ?? [];
  if (
    fromNumbers.length !== toNumbers.length ||
    from.replace(NUMBER, '#') !== to.replace(NUMBER, '#')
  ) {
    return progress < 0.5 ? from : to;
  }
  let index = 0;
  return to.replace(NUMBER, () => {
    const start = Number(fromNumbers[index]);
    const end = Number(toNumbers[index++]);
    return String(+(start + (end - start) * progress).toFixed(4));
  });
}

/**
 * The property of an element that holds the emitter its descendants'
 * animations report to when `animate()` gets none. The compat plugin
 * sets it on a chart's `svg`. A global symbol, so separate builds of the
 * core and `chartist/compat` share it.
 */
export const ANIMATION_EMITTER = Symbol.for('chartist.animationEmitter');

/** The emitter set on the element or its closest ancestor that has one. */
export function animationEmitterOf(node: Element): EventEmitter | undefined {
  for (
    let current: Element | null = node;
    current;
    current = current.parentElement
  ) {
    const emitter = (current as { [ANIMATION_EMITTER]?: EventEmitter })[
      ANIMATION_EMITTER
    ];
    if (emitter) {
      return emitter;
    }
  }
  return undefined;
}

export function createAnimation(
  element: Svg,
  attribute: string,
  animationDefinition: AnimationDefinition,
  createGuided = false,
  eventEmitter?: EventEmitter
) {
  const { easing, ...def } = animationDefinition;
  const attributeProperties: Attributes = {};
  let animationEasing;
  let timeout;

  // Check if an easing is specified in the definition object and delete it from the object as it will not
  // be part of the animate element attributes.
  if (easing) {
    // A curve, a name of `easings` or a CSS easing.
    animationEasing = Array.isArray(easing)
      ? easing
      : (easings[easing as keyof typeof easings] ?? easing);
  }

  // If numeric dur or begin was provided we assume milli seconds
  def.begin = ensureUnit(def.begin, 'ms');
  def.dur = ensureUnit(def.dur, 'ms');

  if (animationEasing) {
    const keySplines = keySplinesOf(animationEasing);
    if (keySplines) {
      def.calcMode = 'spline';
      def.keySplines = keySplines;
      def.keyTimes = '0;1';
    } else if (def.from !== undefined && def.to !== undefined) {
      // Browsers ignore keySplines outside 0 to 1 (back easings) and SMIL
      // has no other easings, so the eased values are written as frames.
      const duration = quantity(def.dur);
      const progress = sampleEasing(
        animationEasing,
        duration.unit === 's' ? duration.value * 1000 : duration.value
      );
      def.calcMode = String(animationEasing).trim().startsWith('steps(')
        ? 'discrete'
        : 'linear';
      def.values = progress
        .map(at => between(String(def.from), String(def.to), at))
        .join(';');
      def.keyTimes = progress
        .map((_, index) => +(index / (progress.length - 1)).toFixed(4))
        .join(';');
    }
  }

  // Adding "fill: freeze" if we are in guided mode and set initial attribute values
  if (createGuided) {
    def.fill = 'freeze';
    // Animated property on our element should already be set to the animation from value in guided mode
    attributeProperties[attribute] = def.from;
    element.attr(attributeProperties);

    // In guided mode we also set begin to indefinite so we can trigger the start manually and put the begin
    // which needs to be in ms aside
    timeout = quantity(def.begin || 0).value;
    def.begin = 'indefinite';
  }

  const animate = element.elem('animate', {
    attributeName: attribute,
    ...def
  });

  if (createGuided) {
    // If guided we take the value that was put aside in timeout and trigger the animation manually with a timeout
    setTimeout(() => {
      // If beginElement fails we set the animated attribute to the end position and remove the animate element
      // This happens if the SMIL ElementTimeControl interface is not supported or any other problems occurred in
      // the browser. (Currently FF 34 does not support animate elements in foreignObjects)
      try {
        // @ts-expect-error Try legacy API.
        animate._node.beginElement();
      } catch (err) {
        // Set animated attribute to current animated value
        attributeProperties[attribute] = def.to;
        element.attr(attributeProperties);
        // Remove the animate element as it's no longer required
        animate.remove();
      }
    }, timeout);
  }

  const animateNode = animate.getNode();

  if (eventEmitter) {
    animateNode.addEventListener('beginEvent', () =>
      eventEmitter.emit<AnimationEvent>('animationBegin', {
        element: element,
        animate: animateNode,
        params: animationDefinition
      })
    );
  }

  animateNode.addEventListener('endEvent', () => {
    if (eventEmitter) {
      eventEmitter.emit<AnimationEvent>('animationEnd', {
        element: element,
        animate: animateNode,
        params: animationDefinition
      });
    }

    if (createGuided) {
      // Set animated attribute to current animated value
      attributeProperties[attribute] = def.to;
      element.attr(attributeProperties);
      // Remove the animate element as it's no longer required
      animate.remove();
    }
  });
}
