/**
 * copy
 * ====
 *
 * Copies remaining files to places other tasks can use.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-copy
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      files: [
        {
          dest: '<%= pkg.config.dist %>/',
          src: 'LICENSE'
        },
        {
          cwd: '<%= pkg.config.src %>',
          expand: true,
          flatten: true,
          filter: 'isFile',
          dest: '<%= pkg.config.dist %>/',
          src: 'css/**',
        }
      ]
    }
  };
};
