/**
 * Event emitter for pipeline phases. Listeners transform a phase by
 * returning a new value; `undefined` keeps the current one. Created by a
 * factory, state lives in the closure.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyListener = (value: any) => unknown;
export type WildcardListener = (name: string, value: unknown) => void;

export interface PhaseEmitter {
  on(name: '*', listener: WildcardListener): void;
  on(name: string, listener: AnyListener): void;
  off(name: '*', listener?: WildcardListener): void;
  off(name: string, listener?: AnyListener): void;
  /**
   * Runs the listeners in registration order, each receiving the previous
   * result. `null` ends the chain (the value is dropped). `'*'` listeners
   * observe the final value.
   */
  transform<T>(name: string, value: T): T | null;
  /** Runs the listeners and ignores their return values. */
  notify(name: string, value: unknown): void;
  /** Removes every listener. */
  clear(): void;
}

export function createPhaseEmitter(): PhaseEmitter {
  const listeners = new Map<string, AnyListener[]>();
  let wildcards: WildcardListener[] = [];

  function observe(name: string, value: unknown) {
    wildcards.forEach(listener => listener(name, value));
  }

  return {
    on(name: string, listener: AnyListener | WildcardListener) {
      if (name === '*') {
        wildcards = [...wildcards, listener as WildcardListener];
      } else {
        listeners.set(name, [
          ...(listeners.get(name) ?? []),
          listener as AnyListener
        ]);
      }
    },
    off(name: string, listener?: AnyListener | WildcardListener) {
      if (name === '*') {
        wildcards = listener ? wildcards.filter(l => l !== listener) : [];
      } else if (listener) {
        listeners.set(
          name,
          (listeners.get(name) ?? []).filter(l => l !== listener)
        );
      } else {
        listeners.delete(name);
      }
    },
    transform<T>(name: string, value: T): T | null {
      let current: T | null = value;
      for (const listener of listeners.get(name) ?? []) {
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
      (listeners.get(name) ?? []).forEach(listener => listener(value));
      observe(name, value);
    },
    clear() {
      listeners.clear();
      wildcards = [];
    }
  };
}
