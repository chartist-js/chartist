/**
 * Simple recursive object extend
 *
 * @memberof Chartist.Core
 * @param {Object} target Target object where the source will be merged into
 * @param {Object...} sources This object (objects) will be merged into target and then target is returned
 * @return {Object} An object that has the same reference as target but is extended and merged with the properties of source
 */
export function extend(target) {
  var i, source, sourceProp;
  target = target || {};

  for (i = 1; i < arguments.length; i++) {
    source = arguments[i];
    for (var prop in source) {
      sourceProp = source[prop];
      if (typeof sourceProp === 'object' && sourceProp !== null && !(sourceProp instanceof Array)) {
        target[prop] = extend(target[prop], sourceProp);
      } else {
        target[prop] = sourceProp;
      }
    }
  }

  return target;
}
