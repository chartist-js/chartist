/**
 * Shared setup for the parity tests: browser-like sizes in jsdom, and the
 * mapping of local axis classes to the published 1.5.0 ones.
 */
import {
  AutoScaleAxis as AutoScaleAxisV1,
  FixedScaleAxis as FixedScaleAxisV1
} from 'chartist-v1';
import { AutoScaleAxis, FixedScaleAxis } from '../../src/axes';
import type { LineChartOptions } from '../../src/charts/LineChart/LineChart.types';

const WIDTH = 600;
const HEIGHT = 300;

const ElementPrototype = Object.getPrototypeOf(SVGElement.prototype);

/** Like a browser: an element with a px (or unitless) size attribute has that size. */
function sized(attribute: 'width' | 'height', fallback: number) {
  return function (this: Element) {
    const match = this.getAttribute(attribute)?.match(/^(\d+(?:\.\d+)?)(px)?$/);
    return match ? Number(match[1]) : fallback;
  };
}

/** Registers the size mocks and cleanup for a test file. */
export function useBrowserSizes() {
  beforeAll(() => {
    // 1.x measures the svg, v2 the container; jsdom has no layout.
    for (const proto of [SVGElement.prototype, HTMLDivElement.prototype]) {
      Object.defineProperties(proto, {
        clientWidth: { configurable: true, get: sized('width', WIDTH) },
        clientHeight: { configurable: true, get: sized('height', HEIGHT) }
      });
    }
  });

  afterAll(() => {
    for (const proto of [SVGElement.prototype, HTMLDivElement.prototype]) {
      Object.defineProperties(proto, {
        clientWidth: Object.getOwnPropertyDescriptor(
          ElementPrototype,
          'clientWidth'
        )!,
        clientHeight: Object.getOwnPropertyDescriptor(
          ElementPrototype,
          'clientHeight'
        )!
      });
    }
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });
}

export function container() {
  const element = document.createElement('div');
  document.body.appendChild(element);
  return element;
}

/**
 * 1.x axes compare `axisUnits` by identity, so 1.5.0 needs its own axis
 * classes; the fixtures use the local ones.
 */
export function withV1Axes(options: LineChartOptions = {}): LineChartOptions {
  const v1 = new Map<unknown, unknown>([
    [AutoScaleAxis, AutoScaleAxisV1],
    [FixedScaleAxis, FixedScaleAxisV1]
  ]);
  const result = { ...options };
  // Only touch axes that have a type: 1.x `extend` would copy an
  // `undefined` axis over the defaults.
  for (const key of ['axisX', 'axisY'] as const) {
    const type = result[key]?.type;
    if (type && v1.has(type)) {
      result[key] = { ...result[key], type: v1.get(type) as never };
    }
  }
  return result;
}
