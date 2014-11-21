/**
 * copy
 * ====
 *
 * Copies remaining files to places other tasks can use.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-copy
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      files: [
        {
          expand: true,
          dot: true,
          cwd: '<%= pkg.config.source %>',
          dest: '<%= pkg.config.dist %>',
          src: [
            '*.{ico,png,txt}',
            '.htaccess',
            '*.html',
            'bower_components/**/*',
            'images/{,*/}*.{webp}',
            'fonts/*'
          ]
        },
        {
          expand: true,
          cwd: '.tmp/images',
          dest: '<%= pkg.config.dist %>/images',
          src: ['generated/*']
        },
        {
          expand: true,
          cwd: '.tmp',
          dest: '<%= pkg.config.dist %>',
          src: [
            '*.html'
          ]
        }
      ]
    },
    libdist: {
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.source %>/styles',
          dest: 'libdist/scss/',
          src: [
            'modules/**/*.scss',
            'settings/**/*.scss',
            '*.scss'
          ]
        },
        {
          dest: 'libdist/',
          src: 'LICENSE'
        }
      ]
    }
  };
};
