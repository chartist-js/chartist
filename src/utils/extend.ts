/**
 * Simple recursive object extend
 * @param target Target object where the source will be merged into
 * @param sources This object (objects) will be merged into target and then target is returned
 * @return An object that has the same reference as target but is extended and merged with the properties of source
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
        !(sourceProp instanceof Array)
      ) {
        target[prop] = extend(target[prop], sourceProp);
      } else {
        target[prop] = sourceProp;
      }
    }
  }

  return target;
}
