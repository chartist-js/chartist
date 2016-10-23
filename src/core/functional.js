/**
 * Helps to simplify functional style code
 *
 * @memberof Chartist.Core
 * @param {*} n This exact value will be returned by the noop function
 * @return {*} The same value that was provided to the n parameter
 */
export function noop(n) {
  return n;
}

/**
 * Functional style helper to produce array with given length initialized with undefined values
 *
 * @memberof Chartist.Core
 * @param length
 * @return {Array}
 */
export function times(length) {
  return Array.apply(null, new Array(length));
}

/**
 * Sum helper to be used in reduce functions
 *
 * @memberof Chartist.Core
 * @param previous
 * @param current
 * @return {*}
 */
export function sum(previous, current) {
  return previous + (current ? current : 0);
}

/**
 * Multiply helper to be used in `Array.map` for multiplying each value of an array with a factor.
 *
 * @memberof Chartist.Core
 * @param {Number} factor
 * @returns {Function} Function that can be used in `Array.map` to multiply each value in an array
 */
export function mapMultiply(factor) {
  return function(num) {
    return num * factor;
  };
}

/**
 * Add helper to be used in `Array.map` for adding a addend to each value of an array.
 *
 * @memberof Chartist.Core
 * @param {Number} addend
 * @returns {Function} Function that can be used in `Array.map` to add a addend to each value in an array
 */
export function mapAdd(addend) {
  return function(num) {
    return num + addend;
  };
}

/**
 * Map for multi dimensional arrays where their nested arrays will be mapped in serial. The output array will have the length of the largest nested array. The callback function is called with variable arguments where each argument is the nested array value (or undefined if there are no more values).
 *
 * @memberof Chartist.Core
 * @param arr
 * @param cb
 * @return {Array}
 */
export function serialMap(arr, cb) {
  var result = [],
    length = Math.max.apply(null, arr.map(function(e) {
      return e.length;
    }));

  times(length).forEach(function(e, index) {
    var args = arr.map(function(e) {
      return e[index];
    });

    result[index] = cb.apply(null, args);
  });

  return result;
}
