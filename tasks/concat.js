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
    dist: {
      options: {
        separator: ';',
        banner: '<%= pkg.config.banner %>'
      },
      files: {
        '<%= pkg.config.dist %>/chartist.js': [
          '<%= pkg.config.src %>/core.js',
          '<%= pkg.config.src %>/event.js',
          '<%= pkg.config.src %>/class.js',
          '<%= pkg.config.src %>/base.js',
          '<%= pkg.config.src %>/svg.js',
          '<%= pkg.config.src %>/charts/line.js',
          '<%= pkg.config.src %>/charts/bar.js',
          '<%= pkg.config.src %>/charts/pie.js'
        ]
      }
    }
  };
};
