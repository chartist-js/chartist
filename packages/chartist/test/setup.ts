/// <reference types="vitest/globals" />
import '@testing-library/jest-dom/vitest';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

// jest-dom 7 augments Vitest's `Assertion<T>`, which has two type parameters
// since Vitest 5, so its matcher types get lost. Vitest 5 merges custom
// matchers through `Matchers<R, T>` instead.
// The type parameters must match Vitest's declaration.
declare module 'vitest' {
  // oxlint-disable-next-line typescript/no-empty-interface
  interface Matchers<
    R extends void | Promise<void> = void | Promise<void>,
    T = unknown
  > extends TestingLibraryMatchers<unknown, R> {}
}

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

const testGlobals = globalThis as unknown as {
  it: typeof it;
  test: typeof test;
};
testGlobals.it = supportDoneCallback(it);
testGlobals.test = supportDoneCallback(test);
