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
    dist: {
      files: [
        {
          dot: true,
          src: [
            '.tmp',
            '<%= pkg.config.dist %>/*',
            '!<%= pkg.config.dist %>/.git*'
          ]
        }
      ]
    },
    server: '.tmp'
  };
};
