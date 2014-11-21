/**
 * doxication
 * ==========
 *
 * Generate API documentation data file for usage in assemble.
 *
 * Link: https://github.com/gionkunz/grunt-doxication
 */

'use strict';

module.exports = function (grunt) {
  return {
      all: {
        options: {
          format: 'yml'
        },
        src: ['source/scripts/*.js'],
        dest: '.tmp/data/apidox.yml'
      }
  };
};
