/**
 * Markup injection payloads for the escaping tests of every output, here
 * and in @chartist-js/terminal. Each would create an element or an event
 * handler attribute if a renderer wrote it unescaped, in an attribute value
 * or in text.
 */
export const payloads = [
  '"><img src=x onerror="alert(1)">',
  "'><svg onload='alert(1)'>",
  '</text><script>alert(1)</script>',
  '<span onclick="alert(1)">x</span>',
  '&lt;img src=x onerror=alert(1)&gt;'
];

/**
 * What a payload would have injected: elements that run or load something,
 * and event handler attributes. Empty when everything stayed data.
 */
export function injected(root: Element): string[] {
  return [root, ...Array.from(root.querySelectorAll('*'))].flatMap(element => [
    ...(['img', 'script', 'iframe'].includes(element.localName)
      ? [`<${element.localName}>`]
      : []),
    ...Array.from(element.attributes)
      .filter(attribute => attribute.name.toLowerCase().startsWith('on'))
      .map(attribute => `${element.localName}[${attribute.name}]`)
  ]);
}

/**
 * Whether the payload is still there: in the text (whitespace aside, as
 * wrapped SVG labels split lines at spaces), or in an attribute value, as
 * given or in another form, such as meta serialized for `ct:meta`.
 */
export function carries(
  root: Element,
  payload: string,
  ...forms: string[]
): boolean {
  const compact = (text: string) => text.replace(/\s+/g, '');
  return (
    compact(root.textContent ?? '').includes(compact(payload)) ||
    [root, ...Array.from(root.querySelectorAll('*'))].some(element =>
      Array.from(element.attributes).some(attribute =>
        [payload, ...forms].some(form => attribute.value.includes(form))
      )
    )
  );
}
