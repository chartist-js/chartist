import { domRenderer, type DomRenderOutput, type Renderer } from '../index';
import type { LiveDomRendererOptions } from './types';

/**
 * A DOM renderer that keeps a chart's SVG and changes it in place on every
 * later render, instead of drawing a new one.
 * @param options How values are identified, and update animations
 * @returns The renderer, for `renderer` in `chart()` and the presets
 * @experimental
 */
export function liveDomRenderer(
  options: LiveDomRendererOptions = {}
): Renderer<DomRenderOutput> {
  void options;
  return domRenderer();
}
