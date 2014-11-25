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
      helpers: ['<%= pkg.config.site %>/templates/helpers/**/*.js'],
      partials: ['<%= pkg.config.site %>/templates/partials/**/*.hbs'],
      layoutdir: '<%= pkg.config.site %>/templates/layouts',
      layoutext: '.hbs',
      layout: ['default'],
      data: [
        '<%= pkg.config.site %>/templates/data/**/*.{json,yml}',
        '<%= pkg.config.tmp %>/data/**/*.{json,yml}'
      ]
    },
    pages: {
      expand: true,
      cwd: '<%= pkg.config.site %>/templates',
      src: ['*.hbs'],
      dest: '<%= pkg.config.tmp %>'
    }
  };
};
