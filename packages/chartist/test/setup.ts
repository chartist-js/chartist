/// <reference types="vitest/globals" />

// Specs that run in the Node environment (`@vitest-environment node`) have
// no window.
if (typeof window !== 'undefined') {
  window.matchMedia = () => ({}) as MediaQueryList;
}
