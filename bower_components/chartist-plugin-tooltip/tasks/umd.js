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
      src: '<%= pkg.config.src %>/scripts/<%= pkg.config.src_name %>.js',
      dest: '<%= pkg.config.dist %>/<%= pkg.config.src_name %>.js',
      objectToExport: 'Chartist.plugins.tooltip',
      deps: {
        default: ['Chartist'],
        amd: ['chartist'],
        cjs: ['chartist'],
        global: ['Chartist']
      },
      indent: '  '
    }
  };
};
