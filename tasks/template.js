/**
 * template
 * ===
 *
 * Replaces template variables inside of files using build stage variables.
 *
 * Link: https://github.com/mathiasbynens/grunt-template
 */

'use strict';

var pkg = require('../package.json');

module.exports = function (grunt) {
  return {
    dist: {
      options: {
        data: {
          pkg: pkg
        }
      },
      files: {
        '<%= pkg.config.dist %>/chartist.js': '<%= pkg.config.dist %>/chartist.js'
      }
    }
  };
};
