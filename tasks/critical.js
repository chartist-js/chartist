/**
 * critical
 * ========
 *
 * Use critical to inline above the fold critical CSS during the build process.
 *
 * Link: https://github.com/bezoerb/grunt-critical
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      options: {
        base: './',
        css: '<%= pkg.config.dist %>/styles/main.css',
        width: 320,
        height: 3000
      },
      src: '<%= pkg.config.dist %>/index.html',
      dest: '<%= pkg.config.dist %>/index.html'
    }
  };
};
