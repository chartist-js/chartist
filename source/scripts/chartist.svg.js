/**
 * Chartist SVG module for simple SVG DOM abstraction
 *
 * @module Chartist.svg
 */
/* global Chartist */
(function(window, document, Chartist) {
  'use strict';

  Chartist.xmlNs = {
    qualifiedName: 'xmlns:ct',
    prefix: 'ct',
    uri: 'http://gionkunz.github.com/chartist-js/ct'
  };

  Chartist.svg = function(name, attributes, className, insertFirst, parent) {

    var svgNs = 'http://www.w3.org/2000/svg',
      xmlNs = 'http://www.w3.org/2000/xmlns/';

    function attr(node, attributes, ns) {
      Object.keys(attributes).forEach(function(key) {
        if(ns) {
          node.setAttributeNS(ns, [Chartist.xmlNs.prefix, ':', key].join(''), attributes[key]);
        } else {
          node.setAttribute(key, attributes[key]);
        }
      });

      return node;
    }

    function elem(svg, name, attributes, className, insertFirst, parentNode) {
      var node = document.createElementNS(svgNs, name);

      // If this is an SVG element created then custom namespace
      if(name === 'svg') {
        node.setAttributeNS(xmlNs, Chartist.xmlNs.qualifiedName, Chartist.xmlNs.uri);
      }

      if(parentNode) {
        if(insertFirst && parentNode.firstChild) {
          parentNode.insertBefore(node, parentNode.firstChild);
        } else {
          parentNode.appendChild(node);
        }
      }

      if(attributes) {
        attr(node, attributes);
      }

      if(className) {
        addClass(node, className);
      }

      return node;
    }

    function text(node, t) {
      node.appendChild(document.createTextNode(t));
    }

    function empty(node) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }

    function remove(node) {
      node.parentNode.removeChild(node);
    }

    function classes(node) {
      return node.getAttribute('class') ? node.getAttribute('class').trim().split(/\s+/) : [];
    }

    function addClass(node, names) {
      if (!(names)) {
        return; // no need to do anything
      }
      node.setAttribute('class',
        classes(node)
          .concat(names.trim().split(/\s+/))
          .filter(function(elem, pos, self) {
            return self.indexOf(elem) === pos;
          }).join(' ')
      );
    }

    function removeClass(node, names) {
      var removedClasses = names.trim().split(/\s+/);

      node.setAttribute('class', classes(node).filter(function(name) {
        return removedClasses.indexOf(name) === -1;
      }).join(' '));
    }

    function removeAllClasses(node) {
      node.className = '';
    }

    return {
      _node: elem(this, name, attributes, className, insertFirst, parent ? parent._node : undefined),
      _parent: parent,
      parent: function() {
        return this._parent;
      },
      attr: function(attributes, ns) {
        attr(this._node, attributes, ns);
        return this;
      },
      empty: function() {
        empty(this._node);
        return this;
      },
      remove: function() {
        remove(this._node);
        return this;
      },
      elem: function(name, attributes, className, insertFirst) {
        return Chartist.svg(name, attributes, className, insertFirst, this);
      },
      text: function(t) {
        text(this._node, t);
        return this;
      },
      addClass: function(names) {
        addClass(this._node, names);
        return this;
      },
      removeClass: function(names) {
        removeClass(this._node, names);
        return this;
      },
      removeAllClasses: function() {
        removeAllClasses(this._node);
        return this;
      },
      classes: function() {
        return classes(this._node);
      }
    };
  };

}(window, document, Chartist));
