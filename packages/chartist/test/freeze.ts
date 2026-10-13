/**
 * Deep-freezes a value, so any mutation throws in strict mode. Used to prove
 * that the v2 core never mutates nodes or payloads it receives.
 */
export function freezeDeep<T>(value: T, seen = new WeakSet<object>()): T {
  if (value && typeof value === 'object' && !seen.has(value)) {
    seen.add(value);
    Object.values(value).forEach(child => freezeDeep(child, seen));
    Object.freeze(value);
  }
  return value;
}
