/**
 * Event emitter for pipeline phases. Listeners transform a phase by
 * returning a new value; `undefined` keeps the current one. Created by a
 * factory, state lives in the closure.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyListener = (value: any) => unknown;
export type WildcardListener = (name: string, value: unknown) => void;

/**
 * Who added a listener: a plugin while it installs, or the chart's user
 * (config `on`, the handle's `on`). `off(name)` without a listener removes
 * only the user's, so it never breaks a plugin.
 */
export type ListenerOwner = 'plugin' | 'user';

export interface PhaseEmitter {
  on(name: '*', listener: WildcardListener, owner?: ListenerOwner): void;
  on(name: string, listener: AnyListener, owner?: ListenerOwner): void;
  /**
   * Removes `listener`, whoever added it, or without a listener, every
   * listener of the event that the user added.
   */
  off(name: '*', listener?: WildcardListener): void;
  off(name: string, listener?: AnyListener): void;
  /**
   * Runs the listeners in registration order, each receiving the previous
   * result. `null` ends the chain (the value is dropped). `'*'` listeners
   * observe the final value.
   */
  transform<T>(name: string, value: T): T | null;
  /** Runs the listeners and returns what they returned. */
  notify(name: string, value: unknown): unknown[];
  /** Removes every listener, plugins' too. */
  clear(): void;
}

interface Entry<T> {
  readonly listener: T;
  readonly owner: ListenerOwner;
}

/** The entries without `listener`, or without the user's ones. */
function without<T>(entries: readonly Entry<T>[], listener?: T) {
  return entries.filter(entry =>
    listener ? entry.listener !== listener : entry.owner !== 'user'
  );
}

export function createPhaseEmitter(): PhaseEmitter {
  const listeners = new Map<string, Entry<AnyListener>[]>();
  let wildcards: Entry<WildcardListener>[] = [];

  function observe(name: string, value: unknown) {
    wildcards.forEach(({ listener }) => listener(name, value));
  }

  return {
    on(
      name: string,
      listener: AnyListener | WildcardListener,
      owner: ListenerOwner = 'user'
    ) {
      if (name === '*') {
        wildcards = [
          ...wildcards,
          { listener: listener as WildcardListener, owner }
        ];
      } else {
        listeners.set(name, [
          ...(listeners.get(name) ?? []),
          { listener: listener as AnyListener, owner }
        ]);
      }
    },
    off(name: string, listener?: AnyListener | WildcardListener) {
      if (name === '*') {
        wildcards = without(wildcards, listener as WildcardListener);
      } else {
        listeners.set(
          name,
          without(listeners.get(name) ?? [], listener as AnyListener)
        );
      }
    },
    transform<T>(name: string, value: T): T | null {
      let current: T | null = value;
      for (const { listener } of listeners.get(name) ?? []) {
        const result = listener(current) as T | null | undefined;
        if (result === null) {
          current = null;
          break;
        }
        if (result !== undefined) {
          current = result;
        }
      }
      observe(name, current);
      return current;
    },
    notify(name: string, value: unknown) {
      const results = (listeners.get(name) ?? []).map(({ listener }) =>
        listener(value)
      );
      observe(name, value);
      return results;
    },
    clear() {
      listeners.clear();
      wildcards = [];
    }
  };
}
