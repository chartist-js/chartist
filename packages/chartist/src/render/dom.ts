import { namespaces } from '../core/constants';
import type { SceneNode } from '../scene/node';
import {
  estimateText,
  type MeasureStyleOptions,
  type MeasureText,
  type MeasureTextOptions
} from './measure';
import { setStyle } from './style';
import type { Renderer, RenderOutput } from './types';

/**
 * What {@link domRenderer} returns from `render()`: the inline SVG it
 * added to the container.
 */
export interface DomRenderOutput extends RenderOutput {
  /** The chart's `svg` element, in the container. */
  readonly svg: SVGSVGElement;
  /** The rendered element of a scene node of this render. */
  readonly elementOf: (node: SceneNode) => Element | undefined;
  /** Takes the SVG out of the container again. */
  readonly remove: () => void;
}

/**
 * Sets one scene attribute on an element as the DOM renderer does: names
 * with a known prefix (`ct:value`) in their namespace, and `style` through
 * the CSSOM, which a Content Security Policy allows. For renderers that
 * change elements they keep.
 *
 * @example
 * ```ts
 * import { applyAttribute } from 'chartist';
 *
 * const point = document.querySelector('.ct-point');
 * if (point) {
 *   applyAttribute(point, 'ct:value', 12);
 *   applyAttribute(point, 'style', 'stroke-width: 12px;');
 * }
 * ```
 * @param element The element to change
 * @param name The attribute's name, as in a scene node's `attrs`
 * @param value The attribute's value
 */
export function applyAttribute(
  element: Element,
  name: string,
  value: string | number
) {
  const separator = name.indexOf(':');
  const prefix = separator > 0 ? name.slice(0, separator) : '';
  if (name === 'style') {
    setStyle(element, String(value));
  } else if (prefix && prefix !== 'xmlns' && namespaces[prefix]) {
    element.setAttributeNS(namespaces[prefix], name, String(value));
  } else {
    element.setAttribute(name, String(value));
  }
}

/** What {@link renderElement} takes besides the node and the document. */
export interface RenderElementOptions {
  /** Creates the elements in the XHTML namespace, as inside a `foreignObject`. */
  readonly html?: boolean;
  /** Called for every node and the element created for it. */
  readonly created?: (node: SceneNode, element: Element) => void;
}

/**
 * Creates the element tree of a scene node as the DOM renderer does: SVG
 * elements, HTML elements inside a `foreignObject`, attributes set with
 * {@link applyAttribute}. For renderers that create elements.
 *
 * @example
 * ```ts
 * import { node, renderElement } from 'chartist';
 *
 * const dot = renderElement(node('circle', { cx: 5, cy: 5, r: 4 }, 'ct-dot'), document);
 * document.querySelector('svg')?.append(dot);
 * ```
 * @param current The node to create
 * @param document The document to create the elements in
 * @param options The namespace, and a callback for each created element
 * @returns The node's element, with its children
 */
export function renderElement(
  current: SceneNode,
  document: Document,
  options: RenderElementOptions = {}
): Element {
  const { html = false, created } = options;
  const element = document.createElementNS(
    html ? namespaces.xhtml : namespaces.svg,
    current.name
  );
  if (current.classes.length) {
    element.setAttribute('class', current.classes.join(' '));
  }
  for (const [name, value] of Object.entries(current.attrs)) {
    applyAttribute(element, name, value);
  }
  // Like textContent = '': empty text creates no text node.
  if (current.content) {
    element.appendChild(document.createTextNode(current.content));
  }
  const childOptions =
    html || current.name !== 'foreignObject'
      ? options
      : { ...options, html: true };
  for (const child of current.children) {
    element.appendChild(renderElement(child, document, childOptions));
  }
  created?.(current, element);
  return element;
}

/** Removes Chartist SVGs (the ones with the ct namespace) from a container. */
function removePrevious(container: Element) {
  Array.from(container.querySelectorAll('svg'))
    .filter(svg => svg.getAttributeNS(namespaces.xmlns, 'ct'))
    .forEach(svg => svg.remove());
}

/**
 * Adds a hidden probe svg (with the chart's root class) holding one element
 * with the given classes to the container, or else the document's body, so
 * the page's CSS applies; reads it and removes the probe again.
 */
function probe<T>(
  document: Document,
  name: 'text' | 'path',
  options: MeasureTextOptions | MeasureStyleOptions,
  read: (node: SVGGraphicsElement) => T
): T {
  const svg = document.createElementNS(namespaces.svg, 'svg');
  setStyle(svg, 'position: absolute; visibility: hidden; width: 0; height: 0;');
  if (options.rootClass) {
    svg.setAttribute('class', options.rootClass);
  }
  const node = document.createElementNS(
    namespaces.svg,
    name
  ) as SVGGraphicsElement;
  if (options.classes?.length) {
    node.setAttribute('class', options.classes.join(' '));
  }
  svg.appendChild(node);
  (options.container ?? document.body).appendChild(svg);
  try {
    return read(node);
  } finally {
    svg.remove();
  }
}

/**
 * Measures text with an offscreen SVG `<text>` in the given document (in
 * the container, if there is one), so CSS fonts apply. Falls back to the
 * estimate where SVG metrics are missing.
 */
function measureInDocument(document: Document): MeasureText {
  return (text, options = {}) =>
    probe(document, 'text', options, node => {
      if (options.fontSize) {
        node.setAttribute('font-size', String(options.fontSize));
      }
      node.textContent = text;
      if (typeof node.getBBox !== 'function') {
        return estimateText(text, options);
      }
      const box = node.getBBox();
      const fontSize = parseFloat(
        document.defaultView?.getComputedStyle(node).fontSize ?? ''
      );
      return box.width || box.height
        ? {
            width: box.width,
            height: box.height,
            ...(fontSize > 0 && { fontSize })
          }
        : estimateText(text, options);
    });
}

/**
 * Creates the renderer `chart()` uses by default: it renders scenes as
 * inline SVG into the container, replacing an earlier Chartist SVG there
 * (as 1.x does) on every render, and measures text and reads styles for
 * layout in the container, so its CSS applies. It ignores the previous
 * render it gets from a chart's second render on; `liveDomRenderer()`
 * from `chartist/live` keeps its SVG and changes it instead.
 * Wrap it to change what every render puts on the page.
 *
 * @example
 * ```ts
 * import { chart, domRenderer, pie, type Renderer } from 'chartist';
 *
 * const dom = domRenderer();
 * // The DOM renderer, with a name for screen readers on every render.
 * const renderer: Renderer = {
 *   ...dom,
 *   render(scene, container) {
 *     const output = dom.render(scene, container);
 *     output.svg.setAttribute('role', 'img');
 *     output.svg.setAttribute('aria-label', 'Monthly budget');
 *     return output;
 *   }
 * };
 *
 * chart('#chart', {
 *   data: { series: [50, 30, 20] },
 *   coordinates: 'polar',
 *   layers: [pie()],
 *   renderer
 * });
 * ```
 */
export function domRenderer(): Renderer<DomRenderOutput> {
  return {
    labels: 'html',
    render(scene, container) {
      const document = container.ownerDocument;
      const elements = new WeakMap<SceneNode, Element>();
      const svg = renderElement(scene, document, {
        created: (node, element) => elements.set(node, element)
      }) as SVGSVGElement;
      svg.setAttributeNS(namespaces.xmlns, 'xmlns:ct', namespaces.ct);
      removePrevious(container);
      container.appendChild(svg);
      return {
        svg,
        elementOf: (node: SceneNode) => elements.get(node),
        remove: () => svg.remove()
      };
    },
    measureText(text, options) {
      // The container's document, not the global one, so charts in an
      // iframe or in a jsdom document measure there (see #1424).
      const document = options?.container?.ownerDocument ?? globalThis.document;
      return document
        ? measureInDocument(document)(text, options)
        : estimateText(text, options);
    },
    measureStyle(property, options = {}) {
      const document = options.container?.ownerDocument ?? globalThis.document;
      const view = document?.defaultView;
      return view
        ? probe(document, 'path', options, node =>
            view.getComputedStyle(node).getPropertyValue(property)
          ) || undefined
        : undefined;
    }
  };
}
