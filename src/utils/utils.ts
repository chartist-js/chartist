import type { FilterByKey } from './types';

/**
 * This function safely checks if an objects has an owned property.
 * @param target The object where to check for a property
 * @param property The property name
 * @returns Returns true if the object owns the specified property
 */
export function safeHasProperty<T, K extends string>(
  target: T,
  property: K
): target is FilterByKey<T, K>;
export function safeHasProperty(target: unknown, property: string) {
  return (
    target !== null &&
    typeof target === 'object' &&
    Reflect.has(target, property)
  );
}

/**
 * Checks if a value can be safely coerced to a number. This includes all values except null which result in finite numbers when coerced. This excludes NaN, since it's not finite.
 */
export function isNumeric(value: number): true;
export function isNumeric(value: unknown): boolean;
export function isNumeric(value: unknown) {
  return value !== null && isFinite(value as number);
}

/**
 * Returns true on all falsey values except the numeric value 0.
 */
export function isFalseyButZero(
  value: unknown
): value is undefined | null | false | '' {
  return !value && value !== 0;
}

/**
 * Returns a number if the passed parameter is a valid number or the function will return undefined. On all other values than a valid number, this function will return undefined.
 */
export function getNumberOrUndefined(value: number): number;
export function getNumberOrUndefined(value: unknown): number | undefined;
export function getNumberOrUndefined(value: unknown) {
  return isNumeric(value) ? Number(value) : undefined;
}

/**
 * Checks if value is array of arrays or not.
 */
export function isArrayOfArrays(data: unknown): data is unknown[][] {
  if (!Array.isArray(data)) {
    return false;
  }

  return data.every(Array.isArray);
}
