/**
 * uglify
 * ======
 *
 * Minify the library.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-uglify
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      options: {
        banner: '<%= pkg.config.banner %>',
        sourceMap: true,
        sourceMapIncludeSources: true
      },
      files: {
        '<%= pkg.config.dist %>/<%= pkg.name %>.min.js': ['<%= pkg.config.dist %>/<%= pkg.name %>.js']
      }
    }
  };
};
