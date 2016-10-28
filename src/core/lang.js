/**
 * Replaces all occurrences of subStr in str with newSubStr and returns a new string.
 *
 * @param {String} str
 * @param {String} subStr
 * @param {String} newSubStr
 * @return {String}
 */
export function replaceAll(str, subStr, newSubStr) {
  return str.replace(new RegExp(subStr, 'g'), newSubStr);
}

/**
 * This is a wrapper around document.querySelector that will return the query if it's already of type Node
 *
 * @memberof Chartist.Core
 * @param {String|Node} query The query to use for selecting a Node or a DOM node that will be returned directly
 * @return {Node}
 */
export function querySelector(query) {
  return query instanceof Node ? query : document.querySelector(query);
}

/**
 * This function safely checks if an objects has an owned property.
 *
 * @param {Object} object The object where to check for a property
 * @param {string} property The property name
 * @returns {boolean} Returns true if the object owns the specified property
 */
export function safeHasProperty(object, property) {
  return object !== null &&
    typeof object === 'object' &&
    object.hasOwnProperty(property);
}

/**
 * Checks if a value can be safely coerced to a number. This includes all values except null which result in finite numbers when coerced. This excludes NaN, since it's not finite.
 *
 * @memberof Chartist.Core
 * @param value
 * @returns {Boolean}
 */
export function isNumeric(value) {
  return value === null ? false : isFinite(value);
}

/**
 * Returns true on all falsey values except the numeric value 0.
 *
 * @memberof Chartist.Core
 * @param value
 * @returns {boolean}
 */
export function isFalseyButZero(value) {
  return !value && value !== 0;
}

/**
 * Returns a number if the passed parameter is a valid number or the function will return undefined. On all other values than a valid number, this function will return undefined.
 *
 * @memberof Chartist.Core
 * @param value
 * @returns {*}
 */
export function getNumberOrUndefined(value) {
  return isNumeric(value) ? +value : undefined;
}

/**
 * Converts a number to a string with a unit. If a string is passed then this will be returned unmodified.
 *
 * @memberof Chartist.Core
 * @param {Number} value
 * @param {String} unit
 * @return {String} Returns the passed number value with unit.
 */
export function ensureUnit(value, unit) {
  if(typeof value === 'number') {
    value = value + unit;
  }

  return value;
}

/**
 * Converts a number or string to a quantity object.
 *
 * @memberof Chartist.Core
 * @param {String|Number} input
 * @return {Object} Returns an object containing the value as number and the unit as string.
 */
export function quantity(input) {
  if(typeof input === 'string') {
    const match = (/^(\d+)\s*(.*)$/g).exec(input);
    return {
      value: +match[1],
      unit: match[2] || undefined
    };
  }

  return {
    value: input
  };
}

/**
 * Generates a-z from a number 0 to 26
 *
 * @memberof Chartist.Core
 * @param {Number} n A number from 0 to 26 that will result in a letter a-z
 * @return {String} A character from a-z based on the input number n
 */
export function alphaNumerate(n) {
  // Limit to a-z
  return String.fromCharCode(97 + n % 26);
}
