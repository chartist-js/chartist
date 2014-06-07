'use strict';

// Export helpers
module.exports.register = function (Handlebars, opt, params)  {
  // The helpers to be exported
  var helpers = {

    snippetPath: function (snippetId, snippetLang) {
      return 'source/site/code-snippets/' + snippetId + '.' + snippetLang || 'js';
    }
  };

  opt = opt || {};
  for (var helper in helpers) {
    if (helpers.hasOwnProperty(helper)) {
      Handlebars.registerHelper(helper, helpers[helper]);
    }
  }
};
