import type { LiveAnimations } from './types';

/**
 * SMIL update animations for {@link liveDomRenderer}, timed by the chart's
 * CSS: `--ct-update-duration` and `--ct-update-easing`.
 * @returns The animations, for `liveDomRenderer({ animations })`
 * @experimental
 */
export function smilAnimations(): LiveAnimations {
  return { animate: () => undefined };
}
