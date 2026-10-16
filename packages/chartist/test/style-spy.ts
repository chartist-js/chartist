const { setAttribute, setAttributeNS } = Element.prototype;

/**
 * Records `style` attributes set with `setAttribute` or `setAttributeNS`.
 * A Content Security Policy without `'unsafe-inline'` for styles blocks
 * those; styles set through the CSSOM (`element.style`) pass.
 */
export function spyOnStyleAttributes() {
  const calls: string[] = [];
  const set = vi
    .spyOn(Element.prototype, 'setAttribute')
    .mockImplementation(function (this: Element, name, value) {
      if (name.toLowerCase() === 'style') {
        calls.push(value);
      }
      setAttribute.call(this, name, value);
    });
  const setNS = vi
    .spyOn(Element.prototype, 'setAttributeNS')
    .mockImplementation(function (this: Element, ns, name, value) {
      if (name.toLowerCase() === 'style') {
        calls.push(value);
      }
      setAttributeNS.call(this, ns, name, value);
    });
  return {
    calls,
    restore() {
      set.mockRestore();
      setNS.mockRestore();
    }
  };
}
