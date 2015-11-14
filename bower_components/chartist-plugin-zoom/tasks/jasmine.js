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
        'bower_components/chartist/dist/chartist.js',
        '<%= pkg.config.src %>/scripts/chartist-plugin-zoom.js'
      ],
      options: {
        specs: '<%= pkg.config.test %>/spec/**/spec-*.js',
        helpers: '<%= pkg.config.test %>/spec/**/helper-*.js',
        vendor: [
          'node_modules/jasmine-jquery/vendor/jquery/jquery.js',          
          'node_modules/jasmine-jquery/lib/jasmine-jquery.js',          
        ],
        phantomjs: {
          'ignore-ssl-errors': true
        }
      }
    }
  };
};
