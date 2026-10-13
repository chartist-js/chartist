/// <reference types="vitest/globals" />

import { detachAll, mockLayout, mockMedia, restoreLayout } from './fixture.ts';

// Tests in the Node environment (`@vitest-environment node`) have no DOM.
if (typeof window !== 'undefined') {
  // jsdom has no matchMedia; responsive options call it. By default no query
  // matches; tests that need matching queries call mockMedia() themselves.
  mockMedia();

  beforeEach(() => mockLayout());
  afterEach(() => {
    detachAll();
    restoreLayout();
    document.body.innerHTML = '';
  });
}
