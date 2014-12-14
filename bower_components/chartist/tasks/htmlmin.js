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
    public: {
      options: {
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeCommentsFromCDATA: true,
        removeOptionalTags: true
      },
      files: [
        {
          expand: true,
          cwd: '<%= pkg.config.public %>',
          src: ['*.html'],
          dest: '<%= pkg.config.public %>'
        }
      ]
    }
  };
};
