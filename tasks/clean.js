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
    public: {
      files: [
        {
          dot: true,
          src: [
            '<%= pkg.config.tmp %>',
            '<%= pkg.config.public %>/*',
            '!<%= pkg.config.public %>/.git*'
          ]
        }
      ]
    },
    tmp: '<%= pkg.config.tmp %>',
    dist: '<%= pkg.config.dist %>'
  };
};
