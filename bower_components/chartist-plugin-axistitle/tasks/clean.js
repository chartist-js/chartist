/**
 * clean
 * =====
 *
 * Remove temporary and unused files.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-clean
 */

'use strict';

module.exports = function (grunt) {
  return {
    tmp: '<%= pkg.config.tmp %>',
    dist: '<%= pkg.config.dist %>'
  };
};
