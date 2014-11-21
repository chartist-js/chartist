/**
 * svgmin
 * ======
 *
 * Minify SVG graphics by removing unnecessary data.
 *
 * Link: https://github.com/sindresorhus/grunt-svgmin
 */

'use strict';

module.exports = function (grunt) {
  return {
    dist: {
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.source %>/images',
          src: '{,*/}*.svg',
          dest: '<%= pkg.config.dist %>/images'
        }
      ],
      options: {
        plugins: [
          { removeEmptyContainers: true },
          { cleanupIDs: false },
          { removeUnknownsAndDefaults: false }
        ]
      }
    }
  };
};
