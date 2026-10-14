/** Narrows a union `T` to the members that have the key `K` (an optional `K` becomes required). */
export type FilterByKey<T, K extends string> =
  T extends Record<K, unknown>
    ? T
    : T extends Partial<Record<K, unknown>>
      ? T & { [key in K]: T[K] }
      : never;

/** `T` with the keys `K` required, and the keys `V` required down one level. */
export type RequiredKeys<T, K extends keyof T, V extends keyof T = never> = T &
  Required<Pick<T, K | V>> & { [key in V]: Required<T[V]> };
