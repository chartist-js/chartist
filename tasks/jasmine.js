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
        'source/scripts/chartist.core.js',
        'source/scripts/chartist.event.js',
        'source/scripts/chartist.class.js',
        'source/scripts/chartist.base.js',
        'source/scripts/chartist.svg.js',
        'source/scripts/chartist.line.js',
        'source/scripts/chartist.bar.js',
        'source/scripts/chartist.pie.js'
      ],
      options: {
        specs: 'test/spec/**/spec-*.js',
        helpers: 'test/spec/**/helper-*.js',
        phantomjs: {
          'ignore-ssl-errors': true
        }
      }
    }
  };
};
