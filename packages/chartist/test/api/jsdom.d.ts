// The part of jsdom's API the tests use: jsdom ships no types.
declare module 'jsdom' {
  export class JSDOM {
    constructor(html?: string);
    readonly window: Window & typeof globalThis;
  }
  /** Referenced by Vitest's types for its jsdom environment options. */
  export type ConstructorOptions = Record<string, unknown>;
}
