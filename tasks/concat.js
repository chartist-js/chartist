/**
 * concat
 * ======
 *
 * Combine files for the library (uncompressed).
 *
 * Link: https://github.com/gruntjs/grunt-contrib-concat
 */

'use strict';

module.exports = function (grunt) {
  return {
    libdist: {
      options: {
        separator: ';',
        banner: '<%= pkg.config.banner %>'
      },
      files: {
        'libdist/chartist.js': [
          'source/scripts/chartist.core.js',
          'source/scripts/chartist.event.js',
          'source/scripts/chartist.class.js',
          'source/scripts/chartist.base.js',
          'source/scripts/chartist.svg.js',
          'source/scripts/chartist.line.js',
          'source/scripts/chartist.bar.js',
          'source/scripts/chartist.pie.js'
        ]
      }
    }
  };
};
