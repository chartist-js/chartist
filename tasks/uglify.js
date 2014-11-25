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
        '<%= pkg.config.dist %>/chartist.min.js': ['<%= pkg.config.dist %>/chartist.js']
      }
    },
    public: {
      options: {
        banner: '<%= pkg.config.banner %>',
      },
      files: {
        '<%= pkg.config.public %>/scripts/all.js': ['<%= pkg.config.public %>/scripts/all.js']
      }
    }
  };
};
