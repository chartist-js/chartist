/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';

window.matchMedia = () => ({}) as MediaQueryList;

type DoneCallback = (error?: unknown) => void;
type TestFn = (...args: unknown[]) => unknown;

/**
 * Jest-style `done` callbacks, used by a few 1.x specs (`it('…', done => …)`).
 * Vitest passes a test context instead, so a test function that declares a
 * parameter is wrapped in a promise that settles when `done` is called.
 */
function supportDoneCallback<T extends object>(testApi: T): T {
  return new Proxy(testApi, {
    apply(target, thisArg, args: unknown[]) {
      const fn = args[1];
      if (typeof fn === 'function' && fn.length > 0) {
        args[1] = () =>
          new Promise<void>((resolve, reject) => {
            const done: DoneCallback = error =>
              error ? reject(error) : resolve();
            (fn as TestFn)(done);
          });
      }
      return Reflect.apply(target as TestFn, thisArg, args);
    }
  });
}

globalThis.it = supportDoneCallback(globalThis.it);
globalThis.test = supportDoneCallback(globalThis.test);
