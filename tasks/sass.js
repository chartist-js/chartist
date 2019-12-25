/**
 * sass
 * ====
 *
 * Compile SASS into CSS with libsass (node-sass).
 *
 * Link: https://github.com/sindresorhus/grunt-sass
 */

'use strict';

const sass = require('node-sass');

module.exports = function (grunt) {
  return {
    options: {
      includePaths: ['<%= pkg.config.site %>/bower_components'],
      imagePath: '<%= pkg.config.site %>/images'
    },
    public: { // without sourcemaps
      options: {
        implementation: sass,
        sourceMap: false
      },
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.site %>/styles',
          src: '{,*/}*.{scss,sass}',
          ext: '.css',
          dest: '<%= pkg.config.tmp %>/styles'
        }
      ]
    },
    dist: {
      options: {
        implementation: sass,
        sourceMap: true
      },
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.src %>/styles',
          src: '{,*/}*.{scss,sass}',
          ext: '.css',
          dest: '<%= pkg.config.tmp %>/styles'
        }
      ]
    },
    tmp: { // with sourcemaps
      options: {
        implementation: sass,
        sourceMap: true
      },
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.site %>/styles',
          src: '{,*/}*.{scss,sass}',
          ext: '.css',
          dest: '<%= pkg.config.tmp %>/styles'
        }
      ]
    }
  };
};
