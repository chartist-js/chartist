/**
 * watch
 * =====
 *
 * Watches files for changes and runs tasks based on the changed files.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-watch
 */

'use strict';

module.exports = function (grunt) {
  return {
    assemble: {
      files: ['<%= pkg.config.source %>/site/**/*.{hbs,yml,json,js}'],
      tasks: ['doxication', 'assemble']
    },
    doxication: {
      files: ['.tmp/data/**/*.{yml,json}'],
      tasks: ['doxication', 'assemble']
    },
    js: {
      files: ['<%= pkg.config.source %>/scripts/{,*/}*.js'],
      tasks: ['newer:jshint:all'],
      options: {
        livereload: true
      }
    },
    jsTest: {
      files: ['test/spec/{,*/}*.js'],
      tasks: ['newer:jshint:test', 'jasmine']
    },
    sass: {
      files: ['<%= pkg.config.source %>/styles/**/*.{scss,sass}'],
      tasks: ['sass:server']
    },
    gruntfile: {
      files: ['Gruntfile.js']
    },
    livereload: {
      options: {
        livereload: '<%= connect.options.livereload %>'
      },
      files: [
        '.tmp/{,*/}*.html',
        '.tmp/styles/{,*/}*.css',
        '<%= pkg.config.source %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
      ]
    }
  };
};
