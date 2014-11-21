/**
 * cssmin
 * ======
 *
 * CSS min for the library.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-cssmin
 */

'use strict';

module.exports = function (grunt) {
  return {
   libdist: {
      options: {
        'banner': '<%= pkg.config.banner %>'
      },
      files: {
        'libdist/chartist.min.css': ['.tmp/styles/chartist.css']
      }
    }
  };
};
