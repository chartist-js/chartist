/**
 * sass
 * ======
 *
 * Compile scss to css
 *
 * Link: https://github.com/gruntjs/grunt-contrib-sass
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      files: [{
        expand: true,
        cwd: '<%= pkg.config.src %>/scss',
        src: ['*.scss'],
        dest: '<%= pkg.config.src %>/css',
        ext: '.css'
      }]
    }
  };
};
