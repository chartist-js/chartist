/**
 * Chartist SVG module for simple SVG DOM abstraction
 *
 * @module Chartist.Svg
 */
/* global Chartist */
(function(window, document, Chartist) {
  'use strict';

  Chartist.xmlNs = {
    qualifiedName: 'xmlns:ct',
    prefix: 'ct',
    uri: 'http://gionkunz.github.com/chartist-js/ct'
  };

  /**
   * Chartist.Svg creates a new SVG object wrapper with a starting element. You can use the wrapper to fluently create sub-elements and modify them.
   *
   * @memberof Chartist.Svg
   * @param {String} name The name of the SVG element to create
   * @param {Object} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
   * @param {String} className This class or class list will be added to the SVG element
   * @param {Object} parent The parent SVG wrapper object where this newly created wrapper and it's element will be attached to as child
   * @param {Boolean} insertFirst If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
   * @returns {Object} Returns a Chartist.Svg wrapper object that can be used to modify the containing SVG data
   */
  Chartist.Svg = function(name, attributes, className, parent, insertFirst) {

    var svgNs = 'http://www.w3.org/2000/svg',
      xmlNs = 'http://www.w3.org/2000/xmlns/',
      xhtmlNs = 'http://www.w3.org/1999/xhtml';

    /**
     * Set attributes on the current SVG element of the wrapper you're currently working on.
     *
     * @memberof Chartist.Svg
     * @param {Object} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
     * @param {String} ns If specified, the attributes will be set as namespace attributes with ns as prefix.
     * @returns {Object} The current wrapper object will be returned so it can be used for chaining.
     */
    function attr(node, attributes, ns) {
      Object.keys(attributes).forEach(function(key) {
        // If the attribute value is undefined we can skip this one
        if(attributes[key] === undefined) {
          return;
        }

        if(ns) {
          node.setAttributeNS(ns, [Chartist.xmlNs.prefix, ':', key].join(''), attributes[key]);
        } else {
          node.setAttribute(key, attributes[key]);
        }
      });

      return node;
    }

    /**
     * Create a new SVG element whose wrapper object will be selected for further operations. This way you can also create nested groups easily.
     *
     * @memberof Chartist.Svg
     * @param {String} name The name of the SVG element that should be created as child element of the currently selected element wrapper
     * @param {Object} [attributes] An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
     * @param {String} [className] This class or class list will be added to the SVG element
     * @param {Boolean} [insertFirst] If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
     * @returns {Object} Returns a Chartist.Svg wrapper object that can be used to modify the containing SVG data
     */
    function elem(name, attributes, className, parentNode, insertFirst) {
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

    /**
     * This method creates a foreignObject (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject) that allows to embed HTML content into a SVG graphic. With the help of foreignObjects you can enable the usage of regular HTML elements inside of SVG where they are subject for SVG positioning and transformation but the Browser will use the HTML rendering capabilities for the containing DOM.
     *
     * @memberof Chartist.Svg
     * @param {Node|String} content The DOM Node, or HTML string that will be converted to a DOM Node, that is then placed into and wrapped by the foreignObject
     * @param {String} [x] The X position where the foreignObject will be placed relative to the next higher ViewBox
     * @param {String} [y] The Y position where the foreignObject will be placed relative to the next higher ViewBox
     * @param {String} [width] The width of the foreignElement
     * @param {String} [height] The height of the foreignElement
     * @param {String} [className] This class or class list will be added to the SVG element
     * @param {Boolean} [insertFirst] Specifies if the foreignObject should be inserted as first child
     * @returns {Object} New wrapper object that wraps the foreignObject element
     */
    function foreignObject(content, x, y, width, height, className, parent, insertFirst) {
      // If content is string then we convert it to DOM
      // TODO: Handle case where content is not a string nor a DOM Node
      if(typeof content === 'string') {
        var container = document.createElement('div');
        container.innerHTML = content;
        content = container.firstChild;
      }

      // Adding namespace to content element
      content.setAttribute('xmlns', xhtmlNs);

      // Creating the foreignObject without required extension attribute (as described here
      // http://www.w3.org/TR/SVG/extend.html#ForeignObjectElement)
      var fnObj = Chartist.Svg('foreignObject', {
        x: x,
        y: y,
        width: width,
        height: height
      }, className, parent, insertFirst);

      // Add content to foreignObjectElement
      fnObj._node.appendChild(content);

      return fnObj;
    }

    /**
     * This method adds a new text element to the current Chartist.Svg wrapper.
     *
     * @memberof Chartist.Svg
     * @param {String} t The text that should be added to the text element that is created
     * @returns {Object} The same wrapper object that was used to add the newly created element
     */
    function text(node, t) {
      node.appendChild(document.createTextNode(t));
    }

    /**
     * This method will clear all child nodes of the current wrapper object.
     *
     * @memberof Chartist.Svg
     * @returns {Object} The same wrapper object that got emptied
     */
    function empty(node) {
      while (node.firstChild) {
        node.removeChild(node.firstChild);
      }
    }

    /**
     * This method will cause the current wrapper to remove itself from its parent wrapper. Use this method if you'd like to get rid of an element in a given DOM structure.
     *
     * @memberof Chartist.Svg
     * @returns {Object} The parent wrapper object of the element that got removed
     */
    function remove(node) {
      node.parentNode.removeChild(node);
    }

    /**
     * This method will replace the element with a new element that can be created outside of the current DOM.
     *
     * @memberof Chartist.Svg
     * @param {Object} newElement The new wrapper object that will be used to replace the current wrapper object
     * @returns {Object} The wrapper of the new element
     */
    function replace(node, newChild) {
      node.parentNode.replaceChild(newChild, node);
    }

    /**
     * This method will append an element to the current element as a child.
     *
     * @memberof Chartist.Svg
     * @param {Object} element The element that should be added as a child
     * @param {Boolean} [insertFirst] Specifies if the element should be inserted as first child
     * @returns {Object} The wrapper of the appended object
     */
    function append(node, child, insertFirst) {
      if(insertFirst && node.firstChild) {
        node.insertBefore(child, node.firstChild);
      } else {
        node.appendChild(child);
      }
    }

    /**
     * Returns an array of class names that are attached to the current wrapper element. This method can not be chained further.
     *
     * @memberof Chartist.Svg
     * @returns {Array} A list of classes or an empty array if there are no classes on the current element
     */
    function classes(node) {
      return node.getAttribute('class') ? node.getAttribute('class').trim().split(/\s+/) : [];
    }

    /**
     * Adds one or a space separated list of classes to the current element and ensures the classes are only existing once.
     *
     * @memberof Chartist.Svg
     * @param {String} names A white space separated list of class names
     * @returns {Object} The wrapper of the current element
     */
    function addClass(node, names) {
      node.setAttribute('class',
        classes(node)
          .concat(names.trim().split(/\s+/))
          .filter(function(elem, pos, self) {
            return self.indexOf(elem) === pos;
          }).join(' ')
      );
    }

    /**
     * Removes one or a space separated list of classes from the current element.
     *
     * @memberof Chartist.Svg
     * @param {String} names A white space separated list of class names
     * @returns {Object} The wrapper of the current element
     */
    function removeClass(node, names) {
      var removedClasses = names.trim().split(/\s+/);

      node.setAttribute('class', classes(node).filter(function(name) {
        return removedClasses.indexOf(name) === -1;
      }).join(' '));
    }

    /**
     * Removes all classes from the current element.
     *
     * @memberof Chartist.Svg
     * @returns {Object} The wrapper of the current element
     */
    function removeAllClasses(node) {
      node.setAttribute('class', '');
    }

    /**
     * Get element height with fallback to svg BoundingBox or parent container dimensions:
     * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
     *
     * @memberof Chartist.Svg
     * @return {Number} The elements height in pixels
     */
    function height(node) {
      return node.clientHeight || Math.round(node.getBBox().height) || node.parentNode.clientHeight;
    }

    /**
     * Get element width with fallback to svg BoundingBox or parent container dimensions:
     * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
     *
     * @memberof Chartist.Core
     * @return {Number} The elements width in pixels
     */
    function width(node) {
      return node.clientWidth || Math.round(node.getBBox().width) || node.parentNode.clientWidth;
    }

    return {
      _node: elem(name, attributes, className, parent ? parent._node : undefined, insertFirst),
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
        return this.parent();
      },
      replace: function(newElement) {
        newElement._parent = this._parent;
        replace(this._node, newElement._node);
        return newElement;
      },
      append: function(element, insertFirst) {
        element._parent = this;
        append(this._node, element._node, insertFirst);
        return element;
      },
      elem: function(name, attributes, className, insertFirst) {
        return Chartist.Svg(name, attributes, className, this, insertFirst);
      },
      foreignObject: function(content, x, y, width, height, className, insertFirst) {
        return foreignObject(content, x, y, width, height, className, this, insertFirst);
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
      },
      height: function() {
        return height(this._node);
      },
      width: function() {
        return width(this._node);
      }
    };
  };

}(window, document, Chartist));