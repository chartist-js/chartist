/**
 * usemin
 * ======
 *
 * Performs rewrites based on rev and the useminPrepare configuration.
 *
 * Link: https://github.com/yeoman/grunt-usemin
 */

'use strict';

module.exports = function (grunt) {
  return {
    html: ['<%= pkg.config.dist %>/{,*/}*.html'],
    css: ['<%= pkg.config.dist %>/styles/{,*/}*.css'],
    options: {
      assetsDirs: ['<%= pkg.config.dist %>'],
      blockReplacements: {
        js: function (block) {

          var asyncScripts = [
            'scripts/all.js'
          ];

          var isAsync = block.async || asyncScripts.indexOf(block.dest) > -1;

          return isAsync ?
            '<script async src="' + block.dest + '"><\/script>' :
            '<script src="' + block.dest + '"><\/script>';
        }
      }
    }
  };
};
