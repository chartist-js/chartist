(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Svg = Chartist.Svg || function svg(name, attributes, parent) {

    var svgns = 'http://www.w3.org/2000/svg';

    function attr(node, attributes) {
      Object.keys(attributes).forEach(function(key) {
        node.setAttribute(key, attributes[key]);
      });

      return node;
    }

    function elem(name, attributes, parentNode) {
      var element = document.createElementNS(svgns, name);
      if(parentNode) {
        parentNode.appendChild(element);
      }

      if(attributes) {
        attr(element, attributes);
      }

      return element;
    }

    function empty(node) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }

    return {
      _node: elem(name, attributes, parent ? parent._node : undefined),
      _parent: parent,
      parent: function() {
        return this._parent;
      },
      attr: function(attributes) {
        attr(this._node, attributes);
        return this;
      },
      empty: function() {
        empty(this._node);
        return this;
      },
      elem: function(name, attributes) {
        return svg(name, attributes, this);
      }
    };

  };

}(document, window, window.Chartist));