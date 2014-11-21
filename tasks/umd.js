/**
 * umd
 * ===
 *
 * Wraps the library into an universal module definition (AMD + CommonJS + Global).
 *
 * Link: https://github.com/bebraw/grunt-umd
 */

'use strict';

module.exports = function (grunt) {
  return {
    libdist: {
      src: 'libdist/chartist.js',
      objectToExport: 'Chartist',
      globalAlias: 'Chartist',
      indent: '  '
    }
  };
};
