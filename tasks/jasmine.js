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
        '<%= pkg.config.src %>/core.js',
        '<%= pkg.config.src %>/event.js',
        '<%= pkg.config.src %>/class.js',
        '<%= pkg.config.src %>/base.js',
        '<%= pkg.config.src %>/svg.js',
        '<%= pkg.config.src %>/types/line.js',
        '<%= pkg.config.src %>/types/bar.js',
        '<%= pkg.config.src %>/types/pie.js'
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
