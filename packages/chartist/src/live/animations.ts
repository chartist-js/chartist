import {
  keySplinesOf,
  namespaces,
  sampleEasing,
  SvgPath,
  type AttrValue,
  type Keyframes,
  type UpdateAnimation
} from '../index';
import { builtInKeyframes } from './keyframes';
import type { LiveAnimations } from './types';

/** The class of the `animate` elements of update animations. */
const ANIMATION_CLASS = 'ct-update-animation';

const NUMBER = /-?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/gi;

/** The CSS easings `--ct-update-easing` takes; anything else is `ease`. */
const CSS_EASING =
  /^(linear|ease(-in|-out|-in-out)?|(cubic-bezier|linear|steps)\(.*\))$/;

/** How a render's animations run. */
interface Timing extends UpdateAnimation {
  /** The eased progress of sampled frames. */
  readonly progress: readonly number[];
  /** The `keySplines` of the easing, when SMIL can express it. */
  readonly splines?: string;
  /** `discrete` for `steps()`, else `linear`. */
  readonly calcMode: string;
}

/** A value's numbers and the text around them, `#` for each number. */
interface Shape {
  readonly text: string;
  readonly numbers: readonly number[];
}

/** A CSS time (`400ms`, `0.4s`) in ms; 0 for anything else. */
function durationOf(value: string | undefined): number {
  const [, amount, unit] =
    value?.trim().match(/^(\d*\.?\d+(?:e[-+]?\d+)?)(m?s)$/i) ?? [];
  return unit ? Number(amount) * (unit.toLowerCase() === 's' ? 1000 : 1) : 0;
}

/** A path's `d` with absolute commands, unrounded. */
function absolutePath(d: string): string {
  const path = new SvgPath(false, { accuracy: false }).parse(d);
  let x = 0;
  let y = 0;
  let startX = 0;
  let startY = 0;
  for (const command of path.pathElements as unknown as Record<
    string,
    number | string
  >[]) {
    const letter = String(command.command);
    if (letter !== letter.toUpperCase()) {
      for (const name of Object.keys(command)) {
        if (name[0] === 'x' && name !== 'xAr') {
          command[name] = Number(command[name]) + x;
        } else if (name[0] === 'y') {
          command[name] = Number(command[name]) + y;
        }
      }
    }
    command.command = letter.toUpperCase();
    if (command.command === 'Z') {
      x = startX;
      y = startY;
    } else {
      x = 'x' in command ? Number(command.x) : x;
      y = 'y' in command ? Number(command.y) : y;
    }
    if (command.command === 'M') {
      startX = x;
      startY = y;
    }
  }
  return path.stringify() + (/z\s*$/i.test(d) ? 'Z' : '');
}

/**
 * The shape of an attribute's value, for a number or a path's `d`;
 * nothing for other values.
 */
function shapeOf(
  name: string,
  value: AttrValue | undefined
): Shape | undefined {
  let text = String(value);
  if (name === 'd') {
    try {
      text = absolutePath(text);
    } catch {
      return undefined;
    }
  } else if (value === undefined || !text.trim() || !isFinite(Number(text))) {
    return undefined;
  }
  return {
    text: text.replace(NUMBER, '#'),
    numbers: (text.match(NUMBER) ?? []).map(Number)
  };
}

/** A shape's text with the given numbers, rounded to 3 decimals. */
function fill(text: string, numbers: readonly number[]): string {
  let index = 0;
  return text.replace(
    /#/g,
    () => `${Math.round(numbers[index++] * 1000) / 1000}`
  );
}

/**
 * Whether an attribute can animate as an offset added to its value: a
 * number, or a path with absolute commands and no arcs, whose flags
 * can't be added.
 */
const isAdditive = (name: string, value: AttrValue, shape: Shape) =>
  name !== 'd' ||
  (!/[mlhvcsqtaz]/.test(String(value)) && !shape.text.includes('A'));

/** Removes an element's update animations that have ended. */
function removeEnded(element: Element) {
  for (const child of Array.from(element.children)) {
    if (child.classList.contains(ANIMATION_CLASS)) {
      const animation = child as SVGAnimationElement;
      try {
        if (
          animation.getStartTime() + animation.getSimpleDuration() <=
          animation.getCurrentTime()
        ) {
          child.remove();
        }
      } catch {
        // Without a current interval it has ended, unless the browser
        // has no SMIL timing (jsdom).
        if (typeof animation.getStartTime === 'function') {
          child.remove();
        }
      }
    }
  }
}

/** Adds an `animate` element to an element and starts it. */
function write(
  element: Element,
  name: string,
  values: readonly string[],
  additive: boolean,
  timing: Timing,
  splines?: string
) {
  const animate = element.ownerDocument.createElementNS(
    namespaces.svg,
    'animate'
  ) as SVGAnimateElement;
  const attributes: Record<string, string | undefined> = {
    class: ANIMATION_CLASS,
    attributeName: name,
    begin: 'indefinite',
    dur: `${timing.duration}ms`,
    fill: 'remove',
    values: values.join(';'),
    keyTimes: values
      .map((_, index) => Math.round((index / (values.length - 1)) * 1e4) / 1e4)
      .join(';'),
    calcMode: splines ? 'spline' : timing.calcMode,
    keySplines: splines,
    additive: additive ? 'sum' : undefined
  };
  for (const [attribute, value] of Object.entries(attributes)) {
    if (value !== undefined) {
      animate.setAttribute(attribute, value);
    }
  }
  animate.addEventListener('endEvent', () => animate.remove());
  element.appendChild(animate);
  try {
    animate.beginElement();
    // Throws when the animation didn't start: Firefox doesn't run
    // animations inside a `foreignObject` (HTML labels), which would
    // never end.
    animate.getStartTime();
  } catch {
    // Without SMIL timing (jsdom), the attribute holds the new value
    // anyway.
    if (typeof animate.getStartTime === 'function') {
      animate.remove();
    }
  }
}

/**
 * Animates an attribute number by number from its previous value: an
 * offset from `previous − next` to 0 when it can be added, else the
 * values themselves. Paths with different commands, or with arcs, don't
 * animate.
 */
function animateNumbers(
  element: Element,
  name: string,
  previous: AttrValue,
  next: AttrValue,
  timing: Timing
) {
  const from = shapeOf(name, previous);
  const to = shapeOf(name, next);
  if (!from || !to || from.text !== to.text || to.text.includes('A')) {
    return;
  }
  const additive = isAdditive(name, next, to);
  const at = (progress: number) =>
    fill(
      to.text,
      to.numbers.map((value, index) =>
        additive
          ? (from.numbers[index] - value) * (1 - progress)
          : (1 - progress) * from.numbers[index] + progress * value
      )
    );
  const progress = timing.splines ? [0, 1] : timing.progress;
  write(element, name, progress.map(at), additive, timing, timing.splines);
}

/**
 * Animates an attribute through keyframes: as offsets from the new value
 * when every frame has its shape, so an interruption continues from where
 * the element is drawn, else as the frames' values.
 */
function animateFrames(
  element: Element,
  name: string,
  frames: readonly AttrValue[],
  next: AttrValue | undefined,
  timing: Timing
) {
  const to = shapeOf(name, next);
  const offsets: string[] = [];
  if (to && isAdditive(name, String(next), to)) {
    for (const frame of frames) {
      const shape = shapeOf(name, frame);
      if (shape?.text !== to.text) {
        break;
      }
      offsets.push(
        fill(
          to.text,
          shape.numbers.map((value, index) => value - to.numbers[index])
        )
      );
    }
  }
  const additive = offsets.length === frames.length;
  write(
    element,
    name,
    additive ? offsets : frames.map(String),
    additive,
    timing
  );
}

/**
 * Animates the changes of an update with SMIL, timed by the chart's CSS:
 * each updated node's changed numbers and paths move from their previous
 * value to their new one over `--ct-update-duration` (a CSS time, such as
 * `400ms`) with the easing in `--ct-update-easing` (a CSS easing, `ease`
 * by default). The attributes hold their new values from the start, and an
 * update during an animation continues from where each element is drawn.
 *
 * It animates updates (`update()`, `setOptions()`) and changes of the
 * matching `responsive` options, not resizes, and nothing while the
 * visitor's system asks for reduced motion. Lines and areas follow their
 * values' keys, and pie slices turn around the pie; layers and plugins can
 * give keyframes of their own.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { liveDomRenderer, smilAnimations } from 'chartist/live';
 *
 * // In the CSS: #chart { --ct-update-duration: 400ms; }
 * const chart = lineChart(
 *   '#chart',
 *   { labels: ['Mon', 'Tue', 'Wed'], series: [[5, 2, 4]] },
 *   { renderer: liveDomRenderer({ animations: smilAnimations() }) }
 * );
 *
 * chart.update({ labels: ['Mon', 'Tue', 'Wed'], series: [[3, 6, 1]] });
 * ```
 * @returns The animations, for `liveDomRenderer({ animations })`
 * @experimental
 */
export function smilAnimations(): LiveAnimations {
  return {
    animate(context) {
      const { update, container, measureStyle } = context;
      const options = {
        container,
        rootClass: context.scene.classes.join(' ')
      };
      const duration = durationOf(
        measureStyle?.('--ct-update-duration', options)
      );
      if (
        (update.cause !== 'update' && update.cause !== 'responsive') ||
        !(duration > 0) ||
        container.ownerDocument.defaultView?.matchMedia?.(
          '(prefers-reduced-motion: reduce)'
        ).matches
      ) {
        return undefined;
      }
      const css = measureStyle?.('--ct-update-easing', options)?.trim() ?? '';
      const easing = CSS_EASING.test(css) ? css : 'ease';
      const timing: Timing = {
        duration,
        easing,
        progress: sampleEasing(easing, duration),
        splines: keySplinesOf(easing),
        calcMode: easing.startsWith('steps(') ? 'discrete' : 'linear'
      };

      for (const { op, node, previous } of context.changes) {
        const element = context.elementOf(node);
        if (op !== 'update' || !previous || !element) {
          continue;
        }
        removeEnded(element);
        const changed = Object.keys(node.attrs).filter(
          name =>
            !name.includes(':') &&
            previous.attrs[name] !== undefined &&
            String(previous.attrs[name]) !== String(node.attrs[name])
        );
        if (!changed.length) {
          continue;
        }
        const frames: Keyframes =
          update.keyframes(previous, node, timing.progress) ??
          builtInKeyframes(previous, node, timing.progress, context) ??
          [];
        const framed = Object.keys(frames[0] ?? {}).filter(name =>
          frames.every(frame => frame[name] !== undefined)
        );
        for (const name of framed) {
          animateFrames(
            element,
            name,
            frames.map(frame => frame[name]),
            node.attrs[name],
            timing
          );
        }
        for (const name of changed) {
          if (!framed.includes(name)) {
            animateNumbers(
              element,
              name,
              previous.attrs[name],
              node.attrs[name],
              timing
            );
          }
        }
      }
      return { duration, easing };
    }
  };
}
