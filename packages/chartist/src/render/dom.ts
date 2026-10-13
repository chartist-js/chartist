import { namespaces } from '../core/constants';
import type { SceneNode } from '../scene/node';
import { estimateText, type MeasureText } from './measure';
import type { Renderer, RenderOutput } from './types';

export interface DomRenderOutput extends RenderOutput {
  readonly svg: SVGSVGElement;
  readonly elementOf: (node: SceneNode) => Element | undefined;
  readonly remove: () => void;
}

function setAttribute(element: Element, name: string, value: string | number) {
  const separator = name.indexOf(':');
  const prefix = separator > 0 ? name.slice(0, separator) : '';
  if (prefix && prefix !== 'xmlns' && namespaces[prefix]) {
    element.setAttributeNS(namespaces[prefix], name, String(value));
  } else {
    element.setAttribute(name, String(value));
  }
}

/**
 * Creates the element tree. Content of a `foreignObject` is HTML and is
 * created in the XHTML namespace.
 */
function build(
  document: Document,
  current: SceneNode,
  elements: WeakMap<SceneNode, Element>,
  html = false
): Element {
  const element = document.createElementNS(
    html ? namespaces.xhtml : namespaces.svg,
    current.name
  );
  if (current.classes.length) {
    element.setAttribute('class', current.classes.join(' '));
  }
  for (const [name, value] of Object.entries(current.attrs)) {
    setAttribute(element, name, value);
  }
  // Like textContent = '': empty text creates no text node.
  if (current.content) {
    element.appendChild(document.createTextNode(current.content));
  }
  const childrenAreHtml = html || current.name === 'foreignObject';
  for (const child of current.children) {
    element.appendChild(build(document, child, elements, childrenAreHtml));
  }
  elements.set(current, element);
  return element;
}

/** Removes Chartist SVGs (the ones with the ct namespace) from a container. */
function removePrevious(container: Element) {
  Array.from(container.querySelectorAll('svg'))
    .filter(svg => svg.getAttributeNS(namespaces.xmlns, 'ct'))
    .forEach(svg => svg.remove());
}

/**
 * Measures text with an offscreen SVG `<text>` in the document, so CSS
 * fonts apply. Falls back to the estimate where SVG metrics are missing.
 */
function measureInDocument(document: Document): MeasureText {
  return (text, options = {}) => {
    const svg = document.createElementNS(namespaces.svg, 'svg');
    svg.setAttribute(
      'style',
      'position: absolute; visibility: hidden; width: 0; height: 0;'
    );
    if (options.rootClass) {
      svg.setAttribute('class', options.rootClass);
    }
    const node = document.createElementNS(
      namespaces.svg,
      'text'
    ) as SVGTextElement;
    if (options.classes?.length) {
      node.setAttribute('class', options.classes.join(' '));
    }
    if (options.fontSize) {
      node.setAttribute('font-size', String(options.fontSize));
    }
    node.textContent = text;
    svg.appendChild(node);
    (options.container ?? document.body).appendChild(svg);
    try {
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
    } finally {
      svg.remove();
    }
  };
}

/**
 * Renders scenes as inline SVG into a container, replacing an earlier
 * Chartist SVG there (as 1.x does).
 * @experimental
 */
export function domRenderer(): Renderer<DomRenderOutput> {
  let measure: MeasureText | undefined;
  return {
    labels: 'html',
    render(scene, container) {
      const document = container.ownerDocument;
      const elements = new WeakMap<SceneNode, Element>();
      const svg = build(document, scene, elements) as SVGSVGElement;
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
      measure ??= measureInDocument(document);
      return measure(text, options);
    }
  };
}
