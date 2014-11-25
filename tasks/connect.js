/**
 * connect
 * =======
 *
 * Starting a localserver for development.
 *
 * Link: https://github.com/gruntjs/grunt-contrib-connect
 */

'use strict';

module.exports = function (grunt) {
  return {
    options: {
      port: 9000,
      // Change this to '0.0.0.0' to access the server from outside.
      hostname: 'localhost',
      livereload: 35729
    },
    livereload: {
      options: {
        open: true,
        base: [
          '<%= pkg.config.tmp %>',
          '<%= pkg.config.src %>',
          '<%= pkg.config.site %>'
        ]
      }
    },
    test: {
      options: {
        port: 9001,
        base: [
          '<%= pkg.config.tmp %>',
          '<%= pkg.config.test %>',
          '<%= pkg.config.site %>'
        ]
      }
    },
    public: {
      options: {
        open: true,
        keepalive: true,
        base: '<%= pkg.config.public %>'
      }
    }
  };
};
