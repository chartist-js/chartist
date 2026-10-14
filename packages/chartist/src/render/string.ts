import { escapingMap, namespaces } from '../core/constants';
import type { SceneNode } from '../scene/node';

const escape = (value: string | number) =>
  String(value).replace(/[&<>"']/g, char => escapingMap[char]);

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
      parts.push(`${name}="${escape(value)}"`);
    }
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serialize(current: SceneNode, position: Position): string {
  const open = `<${current.name}${attributes(current, position)}`;
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
