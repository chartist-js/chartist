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
          '<%= pkg.config.src %>/scripts/event.js',
          '<%= pkg.config.src %>/scripts/class.js',
          '<%= pkg.config.src %>/scripts/base.js',
          '<%= pkg.config.src %>/scripts/svg.js',
          '<%= pkg.config.src %>/scripts/svg-path.js',
          '<%= pkg.config.src %>/scripts/axes/axis.js',
          '<%= pkg.config.src %>/scripts/axes/linear-scale-axis.js',
          '<%= pkg.config.src %>/scripts/axes/step-axis.js',
          '<%= pkg.config.src %>/scripts/axes/date-axis.js',
          '<%= pkg.config.src %>/scripts/charts/line.js',
          '<%= pkg.config.src %>/scripts/charts/lineXY.js',
          '<%= pkg.config.src %>/scripts/charts/bar.js',
          '<%= pkg.config.src %>/scripts/charts/pie.js',
          '<%= pkg.config.src %>/scripts/axes/axis.js',
          '<%= pkg.config.src %>/scripts/ticks/date/date-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/resolution-based-date-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/year-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/month-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/day-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/hour-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/minute-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/seconds-ticks-provider.js',
          '<%= pkg.config.src %>/scripts/ticks/date/milliseconds-ticks-provider.js',
        ]
      }
    }
  };
};
