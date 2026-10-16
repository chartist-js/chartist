import { escapingMap, namespaces } from '../core/constants';
import type { SceneNode } from '../scene/node';

const escape = (value: string | number) =>
  String(value).replace(/[&<>"']/g, char => escapingMap[char]);

// The XML Name production, which the DOM checks in createElementNS and
// setAttribute. Names can't be escaped, so an invalid one throws there and
// here, instead of writing markup that a plugin built from data.
const nameStart =
  'A-Z_:a-z\\u00C0-\\u00D6\\u00D8-\\u00F6\\u00F8-\\u02FF\\u0370-\\u037D' +
  '\\u037F-\\u1FFF\\u200C\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF' +
  '\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD';
const xmlName = new RegExp(
  `^[${nameStart}][${nameStart}\\-.0-9\\u00B7\\u0300-\\u036F\\u203F\\u2040]*$`
);

function checked(name: string, kind: 'element' | 'attribute') {
  if (!xmlName.test(name)) {
    throw new Error(`Chartist: "${name}" is not a valid ${kind} name`);
  }
  return name;
}

type Position = 'root' | 'html-root' | 'other';

function attributes(current: SceneNode, position: Position) {
  const parts: string[] = [];
  if (position === 'root') {
    parts.push(`xmlns="${namespaces.svg}"`, `xmlns:ct="${namespaces.ct}"`);
  } else if (position === 'html-root') {
    // HTML inside a foreignObject; any other xmlns value is replaced.
    parts.push(`xmlns="${namespaces.xhtml}"`);
  }
  if (current.classes.length) {
    parts.push(`class="${escape(current.classes.join(' '))}"`);
  }
  for (const [name, value] of Object.entries(current.attrs)) {
    if (name !== 'xmlns') {
      parts.push(`${checked(name, 'attribute')}="${escape(value)}"`);
    }
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serialize(current: SceneNode, position: Position): string {
  const open = `<${checked(current.name, 'element')}${attributes(current, position)}`;
  const childPosition: Position =
    current.name === 'foreignObject' ? 'html-root' : 'other';
  const content =
    (current.content === undefined ? '' : escape(current.content)) +
    current.children.map(child => serialize(child, childPosition)).join('');
  return content ? `${open}>${content}</${current.name}>` : `${open}/>`;
}

/**
 * Serializes a scene to standalone SVG markup. Needs no DOM, so it works in
 * Node.js and in server bundles.
 *
 * The root gets the SVG and `ct:` namespaces, and attribute values and
 * text are escaped. The markup has the chart's classes but no styles: load
 * `chartist/styles.css` where it's shown, or add a `style` element to the
 * scene.
 *
 * @param scene A scene, usually from `toScene()`
 * @returns The SVG markup, e.g. `<svg xmlns="…" …>…</svg>`
 * @example
 * ```ts
 * import {
 *   autoScaleAxis,
 *   axisGrid,
 *   axisLabels,
 *   cartesianAxes,
 *   line,
 *   renderToString,
 *   stepAxis,
 *   toScene
 * } from 'chartist';
 *
 * export function weekChart(values: number[]): string {
 *   const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
 *   const scene = toScene(
 *     {
 *       data: { labels, series: [values] },
 *       axes: cartesianAxes([
 *         { id: 'x', side: 'bottom', type: stepAxis(), ticks: labels },
 *         { id: 'y', side: 'left', type: autoScaleAxis() }
 *       ]),
 *       layers: [axisGrid(), line(), axisLabels()],
 *       className: 'ct-chart-line'
 *     },
 *     { width: 600, height: 300 }
 *   );
 *   return renderToString(scene);
 * }
 * ```
 * @experimental
 */
export function renderToString(scene: SceneNode): string {
  return serialize(scene, 'root');
}
