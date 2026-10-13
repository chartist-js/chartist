import { escapingMap, namespaces } from '../core/constants';
import type { SceneNode } from '../scene/node';

const escape = (value: string | number) =>
  String(value).replace(/[&<>"']/g, char => escapingMap[char]);

function attributes(current: SceneNode, root: boolean) {
  const parts: string[] = [];
  if (root) {
    parts.push(`xmlns="${namespaces.svg}"`, `xmlns:ct="${namespaces.ct}"`);
  }
  if (current.classes.length) {
    parts.push(`class="${escape(current.classes.join(' '))}"`);
  }
  for (const [name, value] of Object.entries(current.attrs)) {
    parts.push(`${name}="${escape(value)}"`);
  }
  return parts.length ? ` ${parts.join(' ')}` : '';
}

function serialize(current: SceneNode, root: boolean): string {
  const open = `<${current.name}${attributes(current, root)}`;
  const content =
    (current.content === undefined ? '' : escape(current.content)) +
    current.children.map(child => serialize(child, false)).join('');
  return content ? `${open}>${content}</${current.name}>` : `${open}/>`;
}

/**
 * Serializes a scene to standalone SVG markup. Needs no DOM, so it works in
 * Node.js and in server bundles.
 * @experimental
 */
export function renderToString(scene: SceneNode): string {
  return serialize(scene, true);
}
