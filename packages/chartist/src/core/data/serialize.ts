import { escapingMap } from '../constants';

/**
 * This function serializes arbitrary data to a string. In case of data that can't be easily converted to a string, this function will create a wrapper object and serialize the data using JSON.stringify. The outcoming string will always be escaped using Chartist.escapingMap.
 * If called with null or undefined the function will return immediately with null or undefined.
 */
export function serialize(data: number | string | object): string;
export function serialize(
  data: number | string | object | null | undefined | unknown
): string | null | undefined;
export function serialize(
  data: number | string | object | null | undefined | unknown
) {
  let serialized = '';

  if (data === null || data === undefined) {
    return data;
  } else if (typeof data === 'number') {
    serialized = '' + data;
  } else if (typeof data === 'object') {
    serialized = JSON.stringify({ data: data });
  } else {
    serialized = String(data);
  }

  return Object.keys(escapingMap).reduce(
    (result, key) => result.replaceAll(key, escapingMap[key]),
    serialized
  );
}

/**
 * This function de-serializes a string previously serialized with Chartist.serialize. The string will always be unescaped using Chartist.escapingMap before it's returned. Based on the input value the return type can be Number, String or Object. JSON.parse is used with try / catch to see if the unescaped string can be parsed into an Object and this Object will be returned on success.
 */
export function deserialize<T extends object | number | string = object>(
  data: string
): T;
export function deserialize<T extends object | number | string = object>(
  data: string | null | undefined
): T | null | undefined;
export function deserialize(data: unknown) {
  if (typeof data !== 'string') {
    return data;
  }

  if (data === 'NaN') {
    return NaN;
  }

  data = Object.keys(escapingMap).reduce(
    (result, key) => result.replaceAll(escapingMap[key], key),
    data
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let parsedData: any = data;

  if (typeof data === 'string') {
    try {
      parsedData = JSON.parse(data);
      parsedData = parsedData.data !== undefined ? parsedData.data : parsedData;
    } catch (e) {
      /* Ingore */
    }
  }

  return parsedData;
}
