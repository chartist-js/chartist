import {
  applyAttribute,
  namespaces,
  type DomRenderOutput,
  type SceneNode
} from '../index';

/** What {@link adoptSvg} returns when the markup matches the scene. */
export interface AdoptedOutput extends DomRenderOutput {
  /** Attributes, classes and texts that differed and were set. */
  readonly repaired: number;
}

/** Thrown inside the walk; turned into a warning and `undefined`. */
class Mismatch extends Error {}

/** The marker `chart()` removes once it laid the chart out at the real size. */
const MARKER = 'data-ct-hydrate';

const elementChildren = (element: Element) =>
  Array.from(element.childNodes).filter(
    (child): child is Element => child.nodeType === 1
  );

const ownText = (element: Element) =>
  Array.from(element.childNodes)
    .filter(child => child.nodeType === 3)
    .map(child => child.nodeValue)
    .join('');

/** The namespace and local name a scene attribute is set with. */
function qualified(name: string) {
  const separator = name.indexOf(':');
  const prefix = separator > 0 ? name.slice(0, separator) : '';
  return prefix && prefix !== 'xmlns' && namespaces[prefix]
    ? { namespace: namespaces[prefix], local: name.slice(separator + 1) }
    : { namespace: null, local: name };
}

/** The properties a style declaration list sets. */
const properties = (style: string | number | undefined) =>
  new Set(
    String(style ?? '')
      .split(';')
      .map(declaration => declaration.split(':')[0].trim().toLowerCase())
  );

/**
 * Binds a scene's nodes to the elements of server markup from
 * `renderForHydration()`, instead of creating new ones. The structure
 * (element names, namespaces and child element counts; text and comments
 * don't count) has to match. Everything else is made what a fresh render
 * draws: differing attributes, classes and texts are set, attributes the
 * scene doesn't have are removed, `ct:` attributes the HTML parser left
 * without a namespace get it, and the scene's styles are applied through
 * the CSSOM. Returns `undefined`, with a warning naming the first
 * difference, when the structure doesn't match.
 */
export function adoptSvg(
  scene: SceneNode,
  svg: SVGSVGElement
): AdoptedOutput | undefined {
  const elements = new WeakMap<SceneNode, Element>();
  let repaired = 0;

  const walk = (
    current: SceneNode,
    element: Element,
    html: boolean,
    path: string
  ) => {
    const namespace = html ? namespaces.xhtml : namespaces.svg;
    if (
      element.localName !== current.name ||
      element.namespaceURI !== namespace
    ) {
      throw new Mismatch(
        `${path}: expected <${current.name}>, found <${element.localName}>${element.namespaceURI === namespace ? '' : ` in ${element.namespaceURI}`}`
      );
    }
    const children = elementChildren(element);
    if (children.length !== current.children.length) {
      throw new Mismatch(
        `${path}: expected ${current.children.length} child elements, found ${children.length}`
      );
    }
    // Attributes the markup carries for the scene's styles, by design.
    const styled = properties(current.attrs.style);
    const kept = new Set<Attr>();
    for (const [name, value] of Object.entries(current.attrs)) {
      const { namespace: ns, local } = qualified(name);
      if (name === 'style') {
        // Through the CSSOM, which a strict Content Security Policy allows.
        applyAttribute(element, name, value);
      } else {
        // Parsed from HTML, `ct:value` is a plain attribute with a colon.
        const plain = ns ? element.getAttributeNode(name) : null;
        const before = plain?.value ?? element.getAttributeNS(ns, local);
        if (plain) {
          element.removeAttributeNode(plain);
        }
        if (before !== String(value)) {
          repaired += before === null || !styled.has(name) ? 1 : 0;
          applyAttribute(element, name, value);
        } else if (plain) {
          applyAttribute(element, name, value);
        }
      }
      const attribute = element.getAttributeNodeNS(ns, local);
      if (attribute) {
        kept.add(attribute);
      }
    }
    for (const attribute of Array.from(element.attributes)) {
      const { name } = attribute;
      if (
        !kept.has(attribute) &&
        name !== 'class' &&
        name !== MARKER &&
        name !== 'xmlns' &&
        !name.startsWith('xmlns:')
      ) {
        repaired += styled.has(name) ? 0 : 1;
        element.removeAttributeNode(attribute);
      }
    }
    const classes = current.classes.join(' ');
    if ((element.getAttribute('class') ?? '') !== classes) {
      repaired++;
      if (classes) {
        element.setAttribute('class', classes);
      } else {
        element.removeAttribute('class');
      }
    }
    if (
      !current.children.length &&
      (current.content ?? '') !== ownText(element)
    ) {
      repaired++;
      element.textContent = current.content ?? '';
    }
    const inner = html || current.name === 'foreignObject';
    current.children.forEach((child, index) =>
      walk(child, children[index], inner, `${path} > ${child.name}[${index}]`)
    );
    elements.set(current, element);
  };

  try {
    walk(scene, svg, false, 'svg');
  } catch (error) {
    if (error instanceof Mismatch) {
      console.warn(
        `Chartist: the server markup doesn't match the chart, so the chart draws a new svg. The server and the browser should draw the same data and options (${error.message}).`
      );
      return undefined;
    }
    throw error;
  }
  return {
    svg,
    elementOf: (node: SceneNode) => elements.get(node),
    remove: () => svg.remove(),
    repaired
  };
}
