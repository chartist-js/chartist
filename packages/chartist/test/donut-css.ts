/**
 * The default stylesheet's donut rule, for tests that render donuts in
 * jsdom: without CSS, a `path` computes the initial `stroke-width` of
 * 1px, and the DOM renderer would lay the ring out for that. With the
 * rule, jsdom reports `var(--ct-donut-width, 60px)` unresolved, so the
 * layout falls back to 60 px, as with the stylesheet in a browser.
 */
export function useDonutStylesheet() {
  let style: HTMLStyleElement | undefined;
  beforeEach(() => {
    style = document.createElement('style');
    style.textContent =
      '.ct-slice-donut { stroke-width: var(--ct-donut-width, 60px); }';
    document.head.appendChild(style);
  });
  afterEach(() => style?.remove());
}
