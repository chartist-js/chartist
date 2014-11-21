/**
 * changelog
 * =========
 *
 * Create a file with information from git commits.
 *
 * Link: https://github.com/btford/grunt-conventional-changelog
 */

'use strict';

module.exports = function (grunt) {
  return {
    options: {
      dest: 'CHANGELOG.md',
    }
  };
};
