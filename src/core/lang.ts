/**
 * Converts a number to a string with a unit. If a string is passed then this will be returned unmodified.
 * @return Returns the passed number value with unit.
 */
export function ensureUnit<T>(value: T, unit: string) {
  if (typeof value === 'number') {
    return value + unit;
  }

  return value;
}

/**
 * Converts a number or string to a quantity object.
 * @return Returns an object containing the value as number and the unit as string.
 */
export function quantity<T>(input: T) {
  if (typeof input === 'string') {
    const match = /^(\d+)\s*(.*)$/g.exec(input);
    return {
      value: match ? +match[1] : 0,
      unit: match?.[2] || undefined
    };
  }

  return {
    value: Number(input)
  };
}

/**
 * Generates a-z from a number 0 to 26
 * @param n A number from 0 to 26 that will result in a letter a-z
 * @return A character from a-z based on the input number n
 */
export function alphaNumerate(n: number) {
  // Limit to a-z
  return String.fromCharCode(97 + (n % 26));
}
