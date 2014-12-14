/**
 * useminPrepare
 * =============
 *
 * Reads HTML for usemin blocks to enable smart builds that automatically
 * concat, minify and revision files. Creates configurations in memory so
 * additional tasks can operate on them.
 *
 * Link: https://github.com/yeoman/grunt-usemin
 */

'use strict';

module.exports = function (grunt) {
  return {
    options: {
      dest: '<%= pkg.config.public %>'
    },
    html: '<%= pkg.config.tmp %>/index.html'
  }
};
