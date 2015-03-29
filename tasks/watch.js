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
      files: ['<%= pkg.config.site %>/**/*.{hbs,yml,json,js}'],
      tasks: ['assemble']
    },
    doxication: {
      files: ['<%= pkg.config.tmp %>/data/**/*.{yml,json}'],
      tasks: ['assemble']
    },
    js: {
      files: [
        '<%= pkg.config.site %>/scripts/**/*.js',
        '<%= pkg.config.src %>/scripts/**/*.js'
      ],
      tasks: ['newer:jshint:all'],
      options: {
        livereload: true
      }
    },
    jsTest: {
      files: ['<%= pkg.config.test %>/spec/{,*/}*.js'],
      tasks: ['newer:jshint:test', 'jasmine']
    },
    sass: {
      files: [
        '<%= pkg.config.site %>/styles/{,*/}*.{scss,sass}',
        '<%= pkg.config.src %>/styles/{,*/}*.{scss,sass}'
      ],
      tasks: ['sass:public']
    },
    gruntfile: {
      files: ['Gruntfile.js']
    },
    livereload: {
      options: {
        livereload: '<%= connect.options.livereload %>'
      },
      files: [
        '<%= pkg.config.tmp %>/{,*/}*.html',
        '<%= pkg.config.tmp %>/styles/{,*/}*.css',
        '<%= pkg.config.site %>/images/{,*/}*.{png,jpg,jpeg,gif,webp,svg}'
      ]
    }
  };
};
