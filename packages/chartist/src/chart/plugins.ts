import type { ListenerOwner, PhaseEmitter } from '../pipeline/emitter';
import type { PhaseListeners } from '../pipeline/types';
import type { ChartHandle, ChartPlugin, PluginEntry } from './types';
import { untyped } from './types';

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
 * Who a chart's `on` attributes new listeners to: plugins while they
 * install, the user otherwise. `off(name)` removes only the user's.
 */
export interface ListenerScope {
  owner: ListenerOwner;
}

const scopes = new WeakMap<ChartHandle, ListenerScope>();

/** A new scope, attributing listeners to the user. */
export const listenerScope = (): ListenerScope => ({ owner: 'user' });

/** Runs `add` with the chart's listeners attributed to `owner`. */
function addingAs(scope: ListenerScope, owner: ListenerOwner, add: () => void) {
  const previous = scope.owner;
  scope.owner = owner;
  try {
    add();
  } finally {
    scope.owner = previous;
  }
}

/**
 * Internal: adds the listeners in `add` as the user's, though a plugin's
 * `install` runs it. The 1.x classes register their users' listeners from
 * a plugin, so they're in place for the first render.
 */
export function asUserListeners(chart: ChartHandle, add: () => void) {
  const scope = scopes.get(chart);
  if (scope) {
    addingAs(scope, 'user', add);
  } else {
    add();
  }
}

/** What {@link installPlugins} returns about the installed plugins. */
export interface InstalledPlugins {
  /** The plugins, in order. */
  readonly plugins: readonly ChartPlugin[];
  /** The functions their `install` returned, in installation order. */
  readonly cleanups: readonly (() => void)[];
}

/**
 * Installs v2 plugins in order and adds the event names they provide to
 * `provided`. Provided names are known before any plugin installs, so a
 * plugin may listen to events another plugin provides. Listeners added
 * while a plugin installs belong to plugins.
 */
export function installPlugins(
  chart: ChartHandle,
  plugins: readonly PluginEntry[] = [],
  provided: Set<string>,
  scope: ListenerScope
): InstalledPlugins {
  scopes.set(chart, scope);
  const entries = normalize(plugins);
  for (const [plugin] of entries) {
    plugin.provides?.forEach(name => provided.add(name));
  }
  const cleanups: (() => void)[] = [];
  for (const [plugin, options] of entries) {
    addingAs(scope, 'plugin', () => {
      const cleanup = plugin.install(chart, options);
      if (typeof cleanup === 'function') {
        cleanups.push(cleanup as () => void);
      }
    });
  }
  return { plugins: entries.map(([plugin]) => plugin), cleanups };
}

/**
 * Calls every function, also when one throws, and throws the first error
 * afterwards.
 */
export function runAll(functions: readonly (() => void)[]) {
  const errors: unknown[] = [];
  for (const run of functions) {
    try {
      run();
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length) {
    throw errors[0];
  }
}

/** Registers `config.on` listeners. */
export function registerListeners(
  chart: ChartHandle,
  listeners: PhaseListeners = {}
) {
  for (const [name, listener] of Object.entries(listeners)) {
    if (listener) {
      untyped(chart).on(name, listener as (value: unknown) => void);
    }
  }
}

type Listener = (...args: never[]) => unknown;

/**
 * `on`, `off` and `emit` for a handle: forward to the emitter and return
 * the handle. `on` warns once per name for 1.x events nobody provides, and
 * records who adds the listener (see {@link ListenerScope}).
 */
export function eventMethods(
  emitter: PhaseEmitter,
  handle: () => ChartHandle,
  provided: Set<string>,
  scope: ListenerScope
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
      emitter.on(name, listener as (value: unknown) => unknown, scope.owner);
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
