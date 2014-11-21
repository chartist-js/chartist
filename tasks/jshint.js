/**
 * jshint
 * ======
 *
 * Make sure code styles are up to par and there are no obvious mistakes.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-jshint
 */

'use strict';

module.exports = function (grunt) {
  return {
    options: {
      jshintrc: '.jshintrc',
      reporter: require('jshint-stylish')
    },
    all: [
      'Gruntfile.js',
      '<%= pkg.config.source %>/scripts/{,*/}*.js'
    ],
    test: {
      options: {
        jshintrc: 'test/.jshintrc'
      },
      src: ['test/spec/{,*/}*.js']
    }
  };
};
