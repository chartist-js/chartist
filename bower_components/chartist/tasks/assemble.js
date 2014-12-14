/**
 * assemble
 * ========
 *
 * Using the static site generator to build the website.
 *
 * Link: https://github.com/assemble/assemble/
 */

'use strict';

module.exports = function (grunt) {
  return {
    options: {
      helpers: ['<%= pkg.config.site %>/helpers/**/*.js'],
      partials: ['<%= pkg.config.site %>/partials/**/*.hbs'],
      layoutdir: '<%= pkg.config.site %>/layouts',
      layoutext: '.hbs',
      layout: ['default'],
      data: [
        '<%= pkg.config.site %>/data/**/*.{json,yml}',
        '<%= pkg.config.tmp %>/data/**/*.{json,yml}'
      ],
      plugins: ['assemble-dox'],
      dox: {
        sourceFiles: ['<%= pkg.config.src %>/**/*.js'],
        contextRoot: 'apidox'
      }
    },
    pages: {
      expand: true,
      cwd: '<%= pkg.config.site %>/templates',
      src: ['*.hbs'],
      dest: '<%= pkg.config.tmp %>'
    }
  };
};
