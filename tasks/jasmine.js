/**
 * jasmine
 * =======
 *
 * Test settings
 *
 * Link: https://github.com/gruntjs/grunt-contrib-jasmine
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      src: [
        '<%= pkg.config.src %>/scripts/core.js',
        '<%= pkg.config.src %>/scripts/event.js',
        '<%= pkg.config.src %>/scripts/class.js',
        '<%= pkg.config.src %>/scripts/base.js',
        '<%= pkg.config.src %>/scripts/svg.js',
        '<%= pkg.config.src %>/scripts/charts/line.js',
        '<%= pkg.config.src %>/scripts/charts/bar.js',
        '<%= pkg.config.src %>/scripts/charts/pie.js'
      ],
      options: {
        specs: '<%= pkg.config.test %>/spec/**/spec-*.js',
        helpers: '<%= pkg.config.test %>/spec/**/helper-*.js',
        phantomjs: {
          'ignore-ssl-errors': true
        }
      }
    }
  };
};
