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
      hostname: '0.0.0.0',
      livereload: 35729
    },
    livereload: {
      options: {
        open: true,
        base: [
          '.tmp',
          '<%= pkg.config.source %>'
        ]
      }
    },
    test: {
      options: {
        port: 9001,
        base: [
          '.tmp',
          'test',
          '<%= pkg.config.source %>'
        ]
      }
    },
    dist: {
      options: {
        base: '<%= pkg.config.dist %>'
      }
    }
  };
};
