/**
 * Simple recursive object extend
 *
 * @memberof Chartist.Core
 * @param {Object} target Target object where the source will be merged into
 * @param {Object...} sources This object (objects) will be merged into target and then target is returned
 * @return {Object} An object that has the same reference as target but is extended and merged with the properties of source
 */
export function extend(target = {}, ...sources) {
  target = target || {};

  for (let i = 0; i < sources.length; i++) {
    const source = sources[i];
    for (let prop in source) {
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
