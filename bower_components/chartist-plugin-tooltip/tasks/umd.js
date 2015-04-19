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
      src: '<%= pkg.config.src %>/scripts/<%= pkg.name %>.js',
      dest: '<%= pkg.config.dist %>/<%= pkg.name %>.js',
      objectToExport: 'Chartist.plugins.tooltips',
      indent: '  '
    }
  };
};
