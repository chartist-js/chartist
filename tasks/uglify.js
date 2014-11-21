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
    libdist: {
      options: {
        banner: '<%= pkg.config.banner %>', //pkg.config.banner,
        sourceMap: true,
        sourceMapIncludeSources: true
      },
      files: {
        'libdist/chartist.min.js': ['libdist/chartist.js']
      }
    }
  };
};
