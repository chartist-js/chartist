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

  function slugify(str) {
    return str
      .toLowerCase()
      .replace(/[^\w ]+/g,'')
      .replace(/ +/g,'-');
  }

  // The helpers to be exported
  var helpers = {

    pkg: function (key) {
      return pkg[key];
    },

    escape: function(str) {
      return Handlebars.Utils.escapeExpression(str);
    },

    jsonStringify: function(obj) {
      return JSON.stringify(obj);
    },

    slugify: function(str) {
      return slugify(str);
    },

    concat: function() {
      var arr = [];
      for(var i = 0; i < arguments.length - 1; i++) {
        arr[i] = arguments[i];
      }

      return arr.join('');
    },

    partial: function(name, context) {
      var partial = Handlebars.partials[name];

      // Check if partial is not found, invalid or un-compiled and handle accordingly
      if(!partial) {
        throw 'Could not find partial with name "' + name + '".';
      } else if(typeof partial === 'string') {
        // Compile partial as its still a string and update Handlebars
        partial = Handlebars.partials[name] = Handlebars.compile(Handlebars.partials[name]);
      } else if(typeof partial !== 'function') {
        throw 'Found unknown type of partial "' + name + '" (' + typeof Handlebars.partials[name] +
          ') in Handlebars partial Array => ' + Handlebars.partials;
      }

      return new Handlebars.SafeString(partial(context || this));
    },

    atob: function(a) {
      return new Buffer(a, 'base64').toString('utf8');
    },

    btoa: function(b) {
      return new Buffer(b, 'utf8').toString('base64');
    }
  };

  opt = opt || {};
  for (var helper in helpers) {
    if (helpers.hasOwnProperty(helper)) {
      Handlebars.registerHelper(helper, helpers[helper]);
    }
  }
};
