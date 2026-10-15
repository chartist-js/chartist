/**
 * Merges the sources into `target`, deeply, and returns `target`. Plain
 * objects merge key by key into an object already there, and replace any
 * other value (an object over a number gives a copy of the object); arrays,
 * from any realm, and other values replace what's there.
 * Keys of the target's prototype are skipped, against prototype pollution.
 * @param target The object the sources are merged into (changed in place).
 * @returns `target`, with the sources' properties.
 */
export function extend<T>(target: T): T;
export function extend<T, A>(target: T, a: A): T & A;
export function extend<T, A, B>(target: T, a: A, b: B): T & A & B;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function extend(target: any = {}, ...sources: any[]) {
  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    const targetProto = Object.getPrototypeOf(target);
    for (const prop in source) {
      if (targetProto !== null && prop in targetProto) {
        continue; // prevent prototype pollution
      }
      const sourceProp = source[prop];
      if (
        typeof sourceProp === 'object' &&
        sourceProp !== null &&
        !Array.isArray(sourceProp)
      ) {
        const targetProp = target[prop];
        target[prop] = extend(
          typeof targetProp === 'object' && targetProp !== null
            ? targetProp
            : {},
          sourceProp
        );
      } else {
        target[prop] = sourceProp;
      }
    }
  }

  return target;
}
