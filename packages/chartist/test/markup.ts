/**
 * Serializes DOM for parity comparisons: one element per line, attributes
 * sorted by name, namespace URIs shown. Differences show up as readable
 * line diffs in test output.
 *
 * `xmlns` attributes are left out: the element's namespace is compared
 * instead. 1.x sets `xmlns="http://www.w3.org/2000/xmlns/"` on its HTML
 * label spans, which makes serialized charts fail to parse (#1217), and v2
 * doesn't.
 *
 * `style` values are compared as the CSS parser reads them: v2 sets styles
 * through the CSSOM (for Content Security Policies), so the browser writes
 * them back normalized (a trailing `;`) and without declarations it
 * rejects, such as 1.x's unitless `height: 200` that never applied.
 */
export function markup(element: Element, depth = 0): string {
  const indent = '  '.repeat(depth);
  const attrs = Array.from(element.attributes)
    .filter(a => a.name !== 'xmlns')
    .map(a => `${a.name}="${a.name === 'style' ? parsed(a.value) : a.value}"`)
    .sort()
    .join(' ');
  const ns = element.namespaceURI?.split('/').at(-1);
  const lines = [`${indent}<${element.localName} {${ns}} ${attrs}>`];
  for (const child of Array.from(element.childNodes)) {
    if (child.nodeType === 3) {
      lines.push(`${indent}  "${child.textContent}"`);
    } else if (child.nodeType === 1) {
      lines.push(markup(child as Element, depth + 1));
    }
  }
  return lines.join('\n');
}

function parsed(style: string): string {
  const scratch = document.createElement('div');
  scratch.style.cssText = style;
  return scratch.style.cssText;
}
