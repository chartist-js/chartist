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
    public: {
      options: {
        base: './',
        css: '<%= pkg.config.public %>/styles/main.css',
        width: 320,
        height: 3000
      },
      src: '<%= pkg.config.public %>/index.html',
      dest: '<%= pkg.config.public %>/index.html'
    }
  };
};
