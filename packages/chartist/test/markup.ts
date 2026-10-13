/**
 * Serializes DOM for parity comparisons: one element per line, attributes
 * sorted by name, namespace URIs shown. Differences show up as readable
 * line diffs in test output.
 */
export function markup(element: Element, depth = 0): string {
  const indent = '  '.repeat(depth);
  const attrs = Array.from(element.attributes)
    .map(a => `${a.name}="${a.value}"`)
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
