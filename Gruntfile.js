/**
 * Grunt Configurations
 * ====================
 *
 * Seperate tasks and configurations are declared in '/tasks'.
 *
 * Link: https://github.com/firstandthird/load-grunt-config
 */

'use strict';

module.exports = function (grunt) {

  // tracks how long a tasks take
  require('time-grunt')(grunt);

  // load task and configurations
  require('load-grunt-config')(grunt, {
    configPath: __dirname +  '/tasks',
    data: {
      pkg: grunt.file.readJSON('package.json'),
      year: new Date().getFullYear()
    },
    jitGrunt: {
      staticMappings: {
        'useminPrepare': 'grunt-usemin',
        'assemble': 'assemble',
        'changelog': 'grunt-conventional-changelog'
      }
    }
  });

  // Custom task
  grunt.registerTask('server', 'Warning: deprecated task "server"', function(){
    grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
    grunt.task.run(['serve']);
  });

  // Custom task
  grunt.registerTask('serve', 'Start a localserver and serve the files', function (target) {
    if (target === 'dist') {
      return grunt.task.run(['build', 'connect:dist:keepalive']);
    }
    grunt.task.run([
      'clean:server',
      'doxication',
      'assemble',
      'concurrent:server',
      'connect:livereload',
      'watch'
    ]);
  });
};
