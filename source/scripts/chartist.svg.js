/**
 * Chartist SVG module for simple SVG DOM abstraction
 *
 * @module Chartist.Svg
 */
/* global Chartist */
(function(window, document, Chartist) {
  'use strict';

  var svgNs = 'http://www.w3.org/2000/svg',
    xmlNs = 'http://www.w3.org/2000/xmlns/',
    xhtmlNs = 'http://www.w3.org/1999/xhtml';

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
  function Svg(name, attributes, className, parent, insertFirst) {
    this._node = document.createElementNS(svgNs, name);

    // If this is an SVG element created then custom namespace
    if(name === 'svg') {
      this._node.setAttributeNS(xmlNs, Chartist.xmlNs.qualifiedName, Chartist.xmlNs.uri);
    }

    if(attributes) {
      this.attr(attributes);
    }

    if(className) {
      this.addClass(className);
    }

    if(parent) {
      if (insertFirst && parent._node.firstChild) {
        parent._node.insertBefore(this._node, parent._node.firstChild);
      } else {
        parent._node.appendChild(this._node);
      }

      this._parent = parent;
    }
  }

  /**
   * Set attributes on the current SVG element of the wrapper you're currently working on.
   *
   * @memberof Chartist.Svg
   * @param {Object} attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
   * @param {String} ns If specified, the attributes will be set as namespace attributes with ns as prefix.
   * @returns {Object} The current wrapper object will be returned so it can be used for chaining.
   */
  function attr(attributes, ns) {
    Object.keys(attributes).forEach(function(key) {
      // If the attribute value is undefined we can skip this one
      if(attributes[key] === undefined) {
        return;
      }

      if(ns) {
        this._node.setAttributeNS(ns, [Chartist.xmlNs.prefix, ':', key].join(''), attributes[key]);
      } else {
        this._node.setAttribute(key, attributes[key]);
      }
    }.bind(this));

    return this;
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
  function elem(name, attributes, className, insertFirst) {
    return new Chartist.Svg(name, attributes, className, this, insertFirst);
  }

  /**
   * This method creates a foreignObject (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject) that allows to embed HTML content into a SVG graphic. With the help of foreignObjects you can enable the usage of regular HTML elements inside of SVG where they are subject for SVG positioning and transformation but the Browser will use the HTML rendering capabilities for the containing DOM.
   *
   * @memberof Chartist.Svg
   * @param {Node|String} content The DOM Node, or HTML string that will be converted to a DOM Node, that is then placed into and wrapped by the foreignObject
   * @param {String} [attributes] An object with properties that will be added as attributes to the foreignObject element that is created. Attributes with undefined values will not be added.
   * @param {String} [className] This class or class list will be added to the SVG element
   * @param {Boolean} [insertFirst] Specifies if the foreignObject should be inserted as first child
   * @returns {Object} New wrapper object that wraps the foreignObject element
   */
  function foreignObject(content, attributes, className, insertFirst) {
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
    var fnObj = this.elem('foreignObject', attributes, className, insertFirst);

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
  function text(t) {
    this._node.appendChild(document.createTextNode(t));
    return this;
  }

  /**
   * This method will clear all child nodes of the current wrapper object.
   *
   * @memberof Chartist.Svg
   * @returns {Object} The same wrapper object that got emptied
   */
  function empty() {
    while (this._node.firstChild) {
      this._node.removeChild(this._node.firstChild);
    }

    return this;
  }

  /**
   * This method will cause the current wrapper to remove itself from its parent wrapper. Use this method if you'd like to get rid of an element in a given DOM structure.
   *
   * @memberof Chartist.Svg
   * @returns {Object} The parent wrapper object of the element that got removed
   */
  function remove() {
    this._node.parentNode.removeChild(this._node);
    return this._parent;
  }

  /**
   * This method will replace the element with a new element that can be created outside of the current DOM.
   *
   * @memberof Chartist.Svg
   * @param {Object} newElement The new Chartist.Svg object that will be used to replace the current wrapper object
   * @returns {Object} The wrapper of the new element
   */
  function replace(newElement) {
    this._node.parentNode.replaceChild(newElement._node, this._node);
    newElement._parent = this._parent;
    this._parent = null;
    return newElement;
  }

  /**
   * This method will append an element to the current element as a child.
   *
   * @memberof Chartist.Svg
   * @param {Object} element The Chartist.Svg element that should be added as a child
   * @param {Boolean} [insertFirst] Specifies if the element should be inserted as first child
   * @returns {Object} The wrapper of the appended object
   */
  function append(element, insertFirst) {
    if(insertFirst && this._node.firstChild) {
      this._node.insertBefore(element._node, this._node.firstChild);
    } else {
      this._node.appendChild(element._node);
    }

    return this;
  }

  /**
   * Returns an array of class names that are attached to the current wrapper element. This method can not be chained further.
   *
   * @memberof Chartist.Svg
   * @returns {Array} A list of classes or an empty array if there are no classes on the current element
   */
  function classes() {
    return this._node.getAttribute('class') ? this._node.getAttribute('class').trim().split(/\s+/) : [];
  }

  /**
   * Adds one or a space separated list of classes to the current element and ensures the classes are only existing once.
   *
   * @memberof Chartist.Svg
   * @param {String} names A white space separated list of class names
   * @returns {Object} The wrapper of the current element
   */
  function addClass(names) {
    this._node.setAttribute('class',
      this.classes(this._node)
        .concat(names.trim().split(/\s+/))
        .filter(function(elem, pos, self) {
          return self.indexOf(elem) === pos;
        }).join(' ')
    );

    return this;
  }

  /**
   * Removes one or a space separated list of classes from the current element.
   *
   * @memberof Chartist.Svg
   * @param {String} names A white space separated list of class names
   * @returns {Object} The wrapper of the current element
   */
  function removeClass(names) {
    var removedClasses = names.trim().split(/\s+/);

    this._node.setAttribute('class', this.classes(this._node).filter(function(name) {
      return removedClasses.indexOf(name) === -1;
    }).join(' '));

    return this;
  }

  /**
   * Removes all classes from the current element.
   *
   * @memberof Chartist.Svg
   * @returns {Object} The wrapper of the current element
   */
  function removeAllClasses() {
    this._node.setAttribute('class', '');
  }

  /**
   * Get element height with fallback to svg BoundingBox or parent container dimensions:
   * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
   *
   * @memberof Chartist.Svg
   * @return {Number} The elements height in pixels
   */
  function height() {
    return this._node.clientHeight || Math.round(this._node.getBBox().height) || this._node.parentNode.clientHeight;
  }

  /**
   * Get element width with fallback to svg BoundingBox or parent container dimensions:
   * See [bugzilla.mozilla.org](https://bugzilla.mozilla.org/show_bug.cgi?id=530985)
   *
   * @memberof Chartist.Core
   * @return {Number} The elements width in pixels
   */
  function width() {
    return this._node.clientWidth || Math.round(this._node.getBBox().width) || this._node.parentNode.clientWidth;
  }

  function animate(animations, eventEmitter) {
    Object.keys(animations).forEach(function createAnimateForAttributes(attribute) {
      // Adding fill: freeze if not specified
      animations[attribute].fill = animations[attribute].fill || 'freeze';

      var animate = this.elem('animate', Chartist.extend({
        attributeName: attribute
      }, animations[attribute]));

      // Animated attribute is already set to the animation from value for proper delayed animations
      var attributeProperties = {};
      attributeProperties[attribute] = animations[attribute].from;
      this.attr(attributeProperties);

      if(eventEmitter) {
        animate._node.addEventListener('beginEvent', function handleBeginEvent() {
          eventEmitter.emit('animationBegin', {
            element: this,
            animate: animate._node,
            params: animations[attribute]
          });
        }.bind(this));
      }

      animate._node.addEventListener('endEvent', function handleEndEvent() {
        if(eventEmitter) {
          eventEmitter.emit('animationEnd', {
            element: this,
            animate: animate._node,
            params: animations[attribute]
          });
        }

        // Set animated attribute to current animated value
        attributeProperties[attribute] = animations[attribute].to;
        this.attr(attributeProperties);
        // Remove the animate element as it's no longer required
        animate.remove();
      }.bind(this));

    }.bind(this));

    return this;
  }

  Chartist.Svg = Chartist.Class.extend({
    constructor: Svg,
    attr: attr,
    elem: elem,
    foreignObject: foreignObject,
    text: text,
    empty: empty,
    remove: remove,
    replace: replace,
    append: append,
    classes: classes,
    addClass: addClass,
    removeClass: removeClass,
    removeAllClasses: removeAllClasses,
    height: height,
    width: width,
    animate: animate
  });

  /**
   * This method checks for support of a given SVG feature like Extensibility, SVG-animation or the like. Check http://www.w3.org/TR/SVG11/feature for a detailed list.
   *
   * @memberof Chartist.Svg
   * @param {String} feature The SVG 1.1 feature that should be checked for support.
   * @returns {Boolean} True of false if the feature is supported or not
   */
  Chartist.Svg.isSupported = function(feature) {
    return document.implementation.hasFeature('www.http://w3.org/TR/SVG11/feature#' + feature, '1.1');
  };

}(window, document, Chartist));
