/**
 * Common Handlebars Helpers
 * Copyright (c) 2014 Gion Kunz
 * Licensed under the WTFPL License (WTFPL).
 */
'use strict';

var path = require('path');
var fs = require('fs');

// Export helpers
module.exports.register = function (Handlebars, opt, params)  {
  // Loading package.json for later use
  var pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json')));

  // The helpers to be exported
  var helpers = {

    pkg: function (key) {
      return pkg[key];
    }
  };

  opt = opt || {};
  for (var helper in helpers) {
    if (helpers.hasOwnProperty(helper)) {
      Handlebars.registerHelper(helper, helpers[helper]);
    }
  }
};
