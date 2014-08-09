(function (document, window, Chartist, undefined) {
  'use strict';
  Chartist.Svg = Chartist.Svg || function svg(name, attributes, parent) {

    var svgns = 'http://www.w3.org/2000/svg';

    function attr(element, attributes) {
      Object.keys(attributes).forEach(function(key) {
        element.setAttribute(key, attributes[key]);
      });

      return element;
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

    return {
      node: elem(name, attributes, parent ? parent.node : undefined),
      _parent: parent,
      parent: function() {
        return this._parent;
      },
      attr: function(attributes) {
        attr(this.node, attributes);
        return this;
      },
      elem: function(name, attributes) {
        return svg(name, attributes, this);
      }
    };

  };

}(document, window, window.Chartist));