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
      src: '<%= pkg.config.src %>/scripts/chartist-plugin-sketchy.js',
      dest: '<%= pkg.config.dist %>/chartist-plugin-sketchy.js',
      objectToExport: 'Chartist.plugins.ctSketchy',
      indent: '  '
    }
  };
};
