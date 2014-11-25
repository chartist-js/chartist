'use strict';

var path = require('path'),
  _ = require('lodash');

// Export helpers
module.exports.register = function (Handlebars, opt, params)  {
  // The helpers to be exported
  var helpers = {

    doxTag: function(doxElement, doxTagType) {
      return _.find(doxElement.tags, {type: doxTagType});
    },

    doxTagProperty: function(doxElement, doxTagType, doxTagProperty) {
      var doxTag = helpers.doxTag(doxElement, doxTagType);

      if(doxTag) {
        return doxTag[doxTagProperty];
      } else {
        return doxTag;
      }
    },

    doxHash: function(doxElement) {
      return [helpers.doxTagProperty(doxElement, 'memberof', 'string'),
        doxElement.ctx.type,
        doxElement.ctx.name].join(' ')
        .toLowerCase()
        .replace(/[^\w ]+/g,'')
        .replace(/ +/g,'-');
    },

    doxTagsOfType: function(doxElement, doxTagType) {
      return _.filter(doxElement.tags, {type: doxTagType});
    },

    doxTransform: function(dox) {
      return dox.map(function(doxFile) {
        return {
          fileName: path.basename(doxFile.file),
          modules: doxFile.comments.reduce(function(arr, doxElement) {
            var doxModuleName = helpers.doxTagProperty(doxElement, 'module', 'string');

            if(doxModuleName) {
              arr.push({
                name: doxModuleName,
                description: doxElement.description.summary,
                isPrivate: doxElement.isPrivate,
                members: doxFile.comments.filter(function(doxFilterElement) {
                  return helpers.doxTagProperty(doxFilterElement, 'memberof', 'string') === doxModuleName;
                })
              });
            }

            return arr;
          }, [])
        };
      });
    }

  };

  opt = opt || {};
  for (var helper in helpers) {
    if (helpers.hasOwnProperty(helper)) {
      Handlebars.registerHelper(helper, helpers[helper]);
    }
  }
};
