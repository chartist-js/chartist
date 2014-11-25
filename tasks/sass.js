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
      includePaths: ['<%= pkg.config.site %>/bower_components'],
      imagePath: '<%= pkg.config.site %>/images'
    },
    public: { // without sourcemaps
      options: {
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
