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
    public: {
      files: [
        {
          expand: true,
          dot: true,
          cwd: '<%= pkg.config.site %>',
          dest: '<%= pkg.config.public %>',
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
          cwd: '<%= pkg.config.tmp %>/images',
          dest: '<%= pkg.config.public %>/images',
          src: ['generated/*']
        },
        {
          expand: true,
          cwd: '<%= pkg.config.tmp %>',
          dest: '<%= pkg.config.public %>',
          src: [
            '*.html'
          ]
        }
      ]
    },
    dist: {
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.src %>/styles',
          dest: '<%= pkg.config.dist %>/scss/',
          src: [
            'modules/**/*.scss',
            'settings/**/*.scss',
            '*.scss'
          ]
        },
        {
          expand: true,
          cwd: '.tmp/styles',
          dest: '<%= pkg.config.dist %>/',
          src: 'chartist.css*'
        },
        {
          dest: '<%= pkg.config.dist %>/',
          src: 'LICENSE'
        }
      ]
    }
  };
};
