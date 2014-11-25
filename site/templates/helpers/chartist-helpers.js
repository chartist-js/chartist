'use strict';

var fs = require('fs');

// Export helpers
module.exports.register = function (Handlebars, opt, params)  {
  // The helpers to be exported
  var helpers = {

    snippetPath: function (snippetId, snippetLang) {
      return 'site/code-snippets/' + snippetId + '.' + snippetLang || 'js';
    },

    exampleCode: function(exampleId) {
      return new Buffer(fs.readFileSync('site/examples/' + exampleId + '.js', {
        encoding: 'utf8'
      }), 'utf8').toString('base64');
    }
  };

  opt = opt || {};
  for (var helper in helpers) {
    if (helpers.hasOwnProperty(helper)) {
      Handlebars.registerHelper(helper, helpers[helper]);
    }
  }
};
