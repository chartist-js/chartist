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
    dist: {
      src: '<%= pkg.config.dist %>/chartist.js',
      objectToExport: 'Chartist',
      globalAlias: 'Chartist',
      amdModuleId: 'Chartist',
      indent: 2
    }
  };
};
