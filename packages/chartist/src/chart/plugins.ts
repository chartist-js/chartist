import type { PhaseEmitter } from '../pipeline/emitter';
import type { PhaseListeners } from '../pipeline/types';
import type { ChartHandle, ChartPlugin, PluginEntry } from './types';

const PHASES = new Set([
  'resolve',
  'prepare',
  'layout',
  'compose',
  'scene',
  'render',
  'mount'
]);

/**
 * The 1.x event names. Listening to one that no installed plugin provides
 * logs a migration hint; this list is all the core knows about 1.x events.
 */
const LEGACY_EVENTS = new Set([
  'data',
  'optionsChanged',
  'draw',
  'created',
  'animationBegin',
  'animationEnd'
]);

const warnedEvents = new Set<string>();

function warn(message: string) {
  // Intentional: tells 1.x users how to migrate.
  // eslint-disable-next-line no-console
  console.warn(message);
}

/** Plugin entries as `[plugin, options]`; throws for 1.x plugin functions. */
function normalize(plugins: readonly PluginEntry[]) {
  return (plugins as readonly unknown[]).map(entry => {
    const [plugin, options] = Array.isArray(entry) ? entry : [entry];
    if (typeof plugin === 'function') {
      throw new Error(
        `Chartist: the plugin "${plugin.name || 'anonymous'}" is a 1.x plugin (a plain function). ` +
          'chart() and the preset functions accept only v2 plugins; convert it with fromLegacyPlugin() from chartist/compat.'
      );
    }
    return [plugin as ChartPlugin, options] as const;
  });
}

/**
 * Installs v2 plugins in order and returns the event names they provide.
 * Provided names are known before any plugin installs, so a plugin may
 * listen to events another plugin provides.
 */
export function installPlugins(
  chart: ChartHandle,
  plugins: readonly PluginEntry[] = [],
  provided: Set<string>
) {
  const entries = normalize(plugins);
  for (const [plugin] of entries) {
    plugin.provides?.forEach(name => provided.add(name));
  }
  for (const [plugin, options] of entries) {
    plugin.install(chart, options);
  }
}

/** Registers `config.on` listeners. */
export function registerListeners(
  chart: ChartHandle,
  listeners: PhaseListeners = {}
) {
  for (const [name, listener] of Object.entries(listeners)) {
    if (listener) {
      chart.on(name, listener as (value: unknown) => void);
    }
  }
}

type Listener = (...args: never[]) => unknown;

/**
 * `on`, `off` and `emit` for a handle: forward to the emitter and return
 * the handle. `on` warns once per name for 1.x events nobody provides.
 */
export function eventMethods(
  emitter: PhaseEmitter,
  handle: () => ChartHandle,
  provided: Set<string>
): Pick<ChartHandle, 'on' | 'off' | 'emit'> {
  return {
    on: ((name: string, listener: Listener) => {
      if (
        LEGACY_EVENTS.has(name) &&
        !provided.has(name) &&
        !warnedEvents.has(name)
      ) {
        warnedEvents.add(name);
        warn(
          `Chartist: "${name}" is a 1.x event. v2 charts emit it only with the compat plugin: add compat from chartist/compat to plugins (see the migration guide).`
        );
      }
      emitter.on(name, listener as (value: unknown) => unknown);
      return handle();
    }) as ChartHandle['on'],
    off: ((name: string, listener?: Listener) => {
      emitter.off(name, listener as ((value: unknown) => unknown) | undefined);
      return handle();
    }) as ChartHandle['off'],
    emit(name: string, payload?: unknown) {
      if (PHASES.has(name)) {
        throw new Error(
          `Chartist: "${name}" is a phase event; plugins can't emit phase events`
        );
      }
      emitter.notify(name, payload);
    }
  };
}
