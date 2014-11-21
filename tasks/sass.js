/**
 * sass
 * ====
 *
 * Compile SASS into CSS with libsass (node-sass).
 *
 * Link: https://github.com/sindresorhus/grunt-sass
 */

'use strict';

module.exports = function (grunt) {
  return {
    options: {
      includePaths: ['<%= pkg.config.source %>/bower_components'],
      imagePath: '<%= pkg.config.source %>/images'
    },
    dist: {
      options: {
        sourceMap: false
      },
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.source %>/styles',
          src: '{,*/}*.{scss,sass}',
          ext: '.css',
          dest: '.tmp/styles'
        }
      ]
    },
    server: {
      options: {
        sourceMap: true
      },
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.source %>/styles',
          src: '{,*/}*.{scss,sass}',
          ext: '.css',
          dest: '.tmp/styles'
        }
      ]
    }
  };
};
