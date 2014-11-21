/**
 * concurrent
 * ==========
 *
 * Run tasks in parallel to speed up the build process.
 *
 * Link: https://github.com/sindresorhus/grunt-concurrent
 */

'use strict';

module.exports = function (grunt) {
  return {
    server: [
      'sass:server'
    ],
    test: [
      'sass'
    ],
    dist: [
      'sass:dist',
      'imagemin',
      'svgmin'
    ]
  };
};
