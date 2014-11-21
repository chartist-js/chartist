/**
 * htmlmin
 * =======
 *
 * Minify HTML of the website.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-htmlmin
 */

'use strict';

module.exports = function(){
  return {
    dist: {
      options: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeCommentsFromCDATA: true,
        removeOptionalTags: true
      },
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.dist %>',
          src: ['*.html'],
          dest: '<%= pkg.config.dist %>'
        }
      ]
    }
  };
};
