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
          '<%= pkg.config.src %>/scripts/core.js',
          '<%= pkg.config.src %>/scripts/interpolation.js',
          '<%= pkg.config.src %>/scripts/event.js',
          '<%= pkg.config.src %>/scripts/class.js',
          '<%= pkg.config.src %>/scripts/base.js',
          '<%= pkg.config.src %>/scripts/svg.js',
          '<%= pkg.config.src %>/scripts/svg-path.js',
          '<%= pkg.config.src %>/scripts/axes/axis.js',
          '<%= pkg.config.src %>/scripts/axes/linear-scale-axis.js',
          '<%= pkg.config.src %>/scripts/axes/step-axis.js',
          '<%= pkg.config.src %>/scripts/charts/line.js',
          '<%= pkg.config.src %>/scripts/charts/bar.js',
          '<%= pkg.config.src %>/scripts/charts/pie.js'
        ]
      }
    }
  };
};
