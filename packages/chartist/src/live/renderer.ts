import {
  applyAttribute,
  domRenderer,
  renderElement,
  type DomRenderOutput,
  type Renderer,
  type SceneNode
} from '../index';
import { matchScenes, valueKeyOf } from './diff';
import type { LiveDomRendererOptions } from './types';

/** Sets the text of a childless element, keeping elements a listener added. */
function setText(element: Element, content: string | undefined) {
  const text = Array.from(element.childNodes).find(
    child => child.nodeType === 3
  );
  if (!content) {
    text?.remove();
  } else if (text) {
    text.nodeValue = content;
  } else {
    element.insertBefore(
      element.ownerDocument.createTextNode(content),
      element.firstChild
    );
  }
}

/** Changes a kept element from its previous node to its new one. */
function patchElement(element: Element, previous: SceneNode, next: SceneNode) {
  for (const name of Object.keys(previous.attrs)) {
    if (!(name in next.attrs)) {
      element.removeAttribute(name);
    }
  }
  for (const [name, value] of Object.entries(next.attrs)) {
    if (previous.attrs[name] !== value) {
      applyAttribute(element, name, value);
    }
  }
  const removed = previous.classes.filter(name => !next.classes.includes(name));
  const added = next.classes.filter(name => !previous.classes.includes(name));
  if (removed.length) {
    element.classList.remove(...removed);
    // As rendered fresh: no empty class attribute.
    if (!element.classList.length) {
      element.removeAttribute('class');
    }
  }
  if (added.length) {
    element.classList.add(...added);
  }
  if (!next.children.length && previous.content !== next.content) {
    setText(element, next.content);
  }
}

/**
 * Puts the elements of a node's children in their order, from the end:
 * an element moves only when it isn't before its successor already.
 * Elements the scene doesn't know are skipped, so they stay after their
 * previous sibling.
 */
function order(parent: Element, elements: readonly Element[]) {
  const known = new Set(elements);
  let successor: Element | null = null;
  for (let i = elements.length - 1; i >= 0; i--) {
    const element = elements[i];
    let following = element.nextSibling;
    while (following && !known.has(following as Element)) {
      following = following.nextSibling;
    }
    if (element.parentNode !== parent || following !== successor) {
      parent.insertBefore(element, successor);
    }
    successor = element;
  }
}

/**
 * Creates a DOM renderer that keeps a chart's SVG and changes it in place
 * on every later render, instead of drawing a new one: elements that
 * stand for the same thing as before stay, with only their changed
 * attributes, classes and text set, elements for new nodes are created
 * and elements of nodes that are gone are removed. What listeners added
 * to kept elements stays, and `mount` gets the `changes` of the render.
 *
 * Its first render, and every render without the previous one (1.x
 * charts), draws a new SVG as {@link domRenderer} does. The renderer
 * keeps no state of its own, so one instance can serve many charts.
 *
 * @example
 * ```ts
 * import { lineChart } from 'chartist';
 * import { liveDomRenderer } from 'chartist/live';
 *
 * const labels = ['Mo', 'Tu', 'We', 'Th', 'Fr'];
 * const values = [3, 5, 4, 6, 5];
 * const chart = lineChart(
 *   '#chart',
 *   { labels, series: [values] },
 *   // Points and labels follow their day as the window slides.
 *   { renderer: liveDomRenderer({ key: 'label' }) }
 * );
 *
 * let day = 0;
 * setInterval(() => {
 *   labels.push(`Day ${++day}`);
 *   labels.shift();
 *   values.push(Math.round(Math.random() * 10));
 *   values.shift();
 *   chart.update({ labels: [...labels], series: [[...values]] });
 * }, 1000);
 * ```
 * @param options How values are identified (`key`), and update
 *   animations, such as `smilAnimations()`
 * @returns The renderer, for `renderer` in `chart()` and the presets
 * @experimental
 */
export function liveDomRenderer(
  options: LiveDomRendererOptions = {}
): Renderer<DomRenderOutput> {
  const dom = domRenderer();
  const { key, animations } = options;
  const valueKey = valueKeyOf(key);
  return {
    ...dom,
    render(scene, container, update) {
      const svg = update?.previous.elementOf(update.previousScene);
      if (
        !update ||
        !svg ||
        svg.parentNode !== container ||
        scene.name !== update.previousScene.name
      ) {
        return dom.render(scene, container);
      }
      const { labels, previousLabels } = update;
      const document = container.ownerDocument;
      const { changes, matched } = matchScenes(update.previousScene, scene, {
        key,
        labels,
        previousLabels
      });
      const elements = new WeakMap<SceneNode, Element>();
      const created = (current: SceneNode, element: Element) =>
        elements.set(current, element);
      const removed = new Set<SceneNode>();
      for (const change of changes) {
        if (change.op === 'remove') {
          removed.add(change.node);
        }
      }

      const patch = (
        previous: SceneNode,
        next: SceneNode,
        element: Element,
        html: boolean
      ) => {
        elements.set(next, element);
        patchElement(element, previous, next);
        for (const child of previous.children) {
          if (removed.has(child)) {
            update.previous.elementOf(child)?.remove();
          }
        }
        const inner = html || next.name === 'foreignObject';
        const children = next.children.map(child => {
          const kept = matched.get(child);
          const childElement = kept && update.previous.elementOf(kept);
          if (kept && childElement) {
            patch(kept, child, childElement, inner);
            return childElement;
          }
          return renderElement(child, document, { html: inner, created });
        });
        order(element, children);
      };
      patch(update.previousScene, scene, svg, false);

      const elementOf = (node: SceneNode) => elements.get(node);
      const rootClass = scene.classes.join(' ');
      const animation = animations?.animate({
        changes,
        elementOf,
        update,
        container,
        scene,
        measureStyle: (property, measure) =>
          dom.measureStyle?.(property, { container, rootClass, ...measure }),
        valueKey: (value, which) =>
          valueKey({
            ...value,
            label: (which === 'previous' ? previousLabels : labels)[
              value.valueIndex
            ]
          })
      });
      return {
        svg: svg as SVGSVGElement,
        elementOf,
        remove: () => svg.remove(),
        changes,
        patched: true,
        ...(animation && { animation })
      };
    }
  };
}
