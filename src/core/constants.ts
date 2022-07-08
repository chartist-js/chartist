/**
 * This object contains all namespaces used within Chartist.
 */
export const namespaces: Record<string, string> = {
  svg: 'http://www.w3.org/2000/svg',
  xmlns: 'http://www.w3.org/2000/xmlns/',
  xhtml: 'http://www.w3.org/1999/xhtml',
  xlink: 'http://www.w3.org/1999/xlink',
  ct: 'http://gionkunz.github.com/chartist-js/ct'
};

/**
 * Precision level used internally in Chartist for rounding. If you require more decimal places you can increase this number.
 */
export const precision = 8;

/**
 * A map with characters to escape for strings to be safely used as attribute values.
 */
export const escapingMap: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;'
};
