import type { PhaseEmitter } from '../pipeline/emitter';
import type { PhaseListeners } from '../pipeline/types';
import type { ChartHandle, PluginEntry } from './types';

const warned = new Set<unknown>();

/**
 * Installs v2 plugins in order. 1.x plugins (plain functions) are skipped
 * with a one-time warning: they need the compat plugin.
 */
export function installPlugins(
  chart: ChartHandle,
  plugins: readonly PluginEntry[] = []
) {
  for (const entry of plugins as readonly unknown[]) {
    const [plugin, options] = Array.isArray(entry) ? entry : [entry];
    if (typeof plugin === 'function') {
      if (!warned.has(plugin)) {
        warned.add(plugin);
        // Intentional: tells 1.x users how to migrate.
        // eslint-disable-next-line no-console
        console.warn(
          `Chartist: the plugin "${plugin.name || 'anonymous'}" looks like a 1.x plugin (a plain function) and was skipped. 1.x plugins run only with the compat plugin (chartist/compat).`
        );
      }
      continue;
    }
    (plugin as { install: (c: ChartHandle, o: unknown) => void }).install(
      chart,
      options
    );
  }
}

/** Registers `config.on` listeners. */
export function registerListeners(
  emitter: PhaseEmitter,
  listeners: PhaseListeners = {}
) {
  for (const [name, listener] of Object.entries(listeners)) {
    if (listener) {
      emitter.on(name, listener as (value: unknown) => unknown);
    }
  }
}

type Listener = (...args: never[]) => unknown;

/** `on`/`off` for a handle, forwarding to the emitter and returning the handle. */
export function listenerMethods(
  emitter: PhaseEmitter,
  handle: () => ChartHandle
): Pick<ChartHandle, 'on' | 'off'> {
  return {
    on: ((name: string, listener: Listener) => {
      emitter.on(name, listener as (value: unknown) => unknown);
      return handle();
    }) as ChartHandle['on'],
    off: ((name: string, listener?: Listener) => {
      emitter.off(name, listener as ((value: unknown) => unknown) | undefined);
      return handle();
    }) as ChartHandle['off']
  };
}
