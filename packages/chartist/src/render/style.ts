/**
 * Applies a style declaration list through the CSSOM. A Content Security
 * Policy without `'unsafe-inline'` for styles blocks a `style` attribute set
 * by a script, but not `element.style`; the browser still reflects the
 * declarations into the `style` attribute, so the markup stays the same.
 * Elements without a `style` property (none in HTML or SVG documents) get
 * the attribute.
 */
export function setStyle(element: Element, value: string) {
  const { style } = element as Partial<ElementCSSInlineStyle>;
  if (style) {
    style.cssText = value;
  } else {
    element.setAttribute('style', value);
  }
}
