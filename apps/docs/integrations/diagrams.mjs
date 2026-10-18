/**
 * Closes the headless Chromium that renders the docs' diagrams
 * (src/lib/diagrams/render.ts) once Astro no longer needs it: when the
 * build is done and when the dev server stops. The renderer starts it for
 * the first diagram that isn't cached, so most rebuilds never do.
 */
import { closeDiagramBrowser } from '../src/lib/diagrams/render.ts';

/** @returns {import('astro').AstroIntegration} */
export const diagrams = () => ({
  name: 'chartist-diagrams',
  hooks: {
    'astro:build:done': closeDiagramBrowser,
    'astro:server:done': closeDiagramBrowser
  }
});
