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
      helpers: ['<%= pkg.config.source %>/site/helpers/**/*.js'],
      partials: ['<%= pkg.config.source %>/site/partials/**/*.hbs'],
      layoutdir: '<%= pkg.config.source %>/site/layouts',
      layoutext: '.hbs',
      layout: ['default'],
      data: ['<%= pkg.config.source %>/site/data/**/*.{json,yml}', '.tmp/data/**/*.{json,yml}']
    },
    pages: {
      expand: true,
      cwd: '<%= pkg.config.source %>/site',
      src: ['*.hbs'],
      dest: '.tmp'
    }
  };
};
