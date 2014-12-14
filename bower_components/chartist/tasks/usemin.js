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
    html: ['<%= pkg.config.public %>/{,*/}*.html'],
    css: ['<%= pkg.config.public %>/styles/{,*/}*.css'],
    options: {
      assetsDirs: ['<%= pkg.config.public %>'],
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
