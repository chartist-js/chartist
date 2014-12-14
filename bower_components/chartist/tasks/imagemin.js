/**
 * imagemin
 * ========
 *
 * The following *-min tasks produce minified files in the dist folder.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-imagemin
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.site %>/images',
          src: '{,*/}*.{png,jpg,jpeg,gif}',
          dest: '<%= pkg.config.public %>/images'
        }
      ]
    }
  }
};
