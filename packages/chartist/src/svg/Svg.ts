import type { EventEmitter } from '../event';
import { namespaces } from '../core/constants';
import type { Attributes, AnimationDefinition } from './types';
import { SvgList } from './SvgList';
import { animationEmitterOf, createAnimation, easings } from './animation';

/**
 * Wraps an SVG element for chaining: set attributes and classes, add child
 * elements, and animate attributes with SMIL. Wrap an element of a rendered
 * chart (from `elementOf` in a `mount` listener), or create a new one by
 * name.
 *
 * @example
 * ```ts
 * import { barChart, findAll, Svg, type ChartPlugin } from 'chartist';
 *
 * // Bars grow from the axis, animated from a plugin's mount listener.
 * const growBars: ChartPlugin = {
 *   name: 'grow-bars',
 *   install(chart) {
 *     chart.on('mount', ({ scene, elementOf }) => {
 *       for (const bar of findAll(scene, { role: 'bar' })) {
 *         const element = elementOf(bar);
 *         if (element) {
 *           new Svg(element).animate({
 *             y2: {
 *               begin: bar.ctx.valueIndex * 120,
 *               dur: 700,
 *               from: bar.attrs.y1,
 *               to: bar.attrs.y2,
 *               easing: 'easeOutQuint'
 *             }
 *           });
 *         }
 *       }
 *     });
 *   }
 * };
 *
 * barChart('#chart', { series: [[5, 4, 3, 7]] }, { plugins: [growBars] });
 * ```
 */
export class Svg {
  /**
   * The easing curves for {@link Svg.animate}, as 1.x had them on the class.
   * @deprecated Use the {@link easings} export.
   */
  static readonly Easing = easings;

  private _node: Element;

  /**
   * Creates an SVG element and wraps it, or wraps an existing element.
   * @param name The name of the SVG element to create or an SVG dom element which should be wrapped into Svg
   * @param attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
   * @param className This class or class list will be added to the SVG element
   * @param parent The parent SVG wrapper object where this newly created wrapper and it's element will be attached to as child
   * @param insertFirst If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
   */
  constructor(
    name: string | Element,
    attributes?: Attributes,
    className?: string,
    parent?: Svg,
    insertFirst = false
  ) {
    // If Svg is getting called with an SVG element we just return the wrapper
    if (name instanceof Element) {
      this._node = name;
    } else {
      // In the parent's document, so elements can be added to an iframe's
      // or a jsdom document's chart (see #1424).
      this._node = (parent?._node.ownerDocument ?? document).createElementNS(
        namespaces.svg,
        name
      );

      // If this is an SVG element created then custom namespace
      if (name === 'svg') {
        this.attr({
          'xmlns:ct': namespaces.ct
        });
      }
    }

    if (attributes) {
      this.attr(attributes);
    }

    if (className) {
      this.addClass(className);
    }

    if (parent) {
      if (insertFirst && parent._node.firstChild) {
        parent._node.insertBefore(this._node, parent._node.firstChild);
      } else {
        parent._node.appendChild(this._node);
      }
    }
  }

  /**
   * Set attributes on the current SVG element of the wrapper you're currently working on.
   * @param attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added. If this parameter is a String then the function is used as a getter and will return the attribute value.
   * @param ns If specified, the attribute will be obtained using getAttributeNs. In order to write namepsaced attributes you can use the namespace:attribute notation within the attributes object.
   * @return The current wrapper object will be returned so it can be used for chaining or the attribute value if used as getter function.
   */
  attr(attributes: string, ns?: string): string | null;
  attr(attributes: Attributes): this;
  attr(attributes: string | Attributes, ns?: string) {
    if (typeof attributes === 'string') {
      if (ns) {
        return this._node.getAttributeNS(ns, attributes);
      } else {
        return this._node.getAttribute(attributes);
      }
    }

    Object.keys(attributes).forEach(key => {
      // If the attribute value is undefined we can skip this one
      if (attributes[key] === undefined) {
        return;
      }

      if (key.indexOf(':') !== -1) {
        const namespacedAttribute = key.split(':');
        this._node.setAttributeNS(
          namespaces[namespacedAttribute[0]],
          key,
          String(attributes[key])
        );
      } else {
        this._node.setAttribute(key, String(attributes[key]));
      }
    });

    return this;
  }

  /**
   * Create a new SVG element whose wrapper object will be selected for further operations. This way you can also create nested groups easily.
   * @param name The name of the SVG element that should be created as child element of the currently selected element wrapper
   * @param attributes An object with properties that will be added as attributes to the SVG element that is created. Attributes with undefined values will not be added.
   * @param className This class or class list will be added to the SVG element
   * @param insertFirst If this param is set to true in conjunction with a parent element the newly created element will be added as first child element in the parent element
   * @return Returns a Svg wrapper object that can be used to modify the containing SVG data
   */
  elem(
    name: string,
    attributes?: Attributes,
    className?: string,
    insertFirst = false
  ) {
    return new Svg(name, attributes, className, this, insertFirst);
  }

  /**
   * Wraps the element's parent.
   * @returns The parent in a new `Svg`, or `null` if there is none or it isn't an SVG element.
   */
  parent() {
    return this._node.parentNode instanceof SVGElement
      ? new Svg(this._node.parentNode)
      : null;
  }

  /**
   * This method returns a Svg wrapper around the root SVG element of the current tree.
   * @return The root SVG element wrapped in a Svg element
   */
  root() {
    let node = this._node;

    while (node.nodeName !== 'svg') {
      if (node.parentElement) {
        node = node.parentElement;
      } else {
        break;
      }
    }

    return new Svg(node);
  }

  /**
   * Find the first child SVG element of the current element that matches a CSS selector. The returned object is a Svg wrapper.
   * @param selector A CSS selector that is used to query for child SVG elements
   * @return The SVG wrapper for the element found or null if no element was found
   */
  querySelector(selector: string) {
    const foundNode = this._node.querySelector(selector);
    return foundNode ? new Svg(foundNode) : null;
  }

  /**
   * Finds all descendants of the element that match a CSS selector.
   * @param selector A CSS selector that is used to query for child SVG elements
   * @returns The elements found in an {@link SvgList} (empty if none match).
   */
  querySelectorAll(selector: string) {
    const foundNodes = this._node.querySelectorAll(selector);
    return new SvgList(foundNodes);
  }

  /**
   * Returns the underlying SVG node for the current element.
   */
  getNode<T extends Element = Element>() {
    return this._node as T;
  }

  /**
   * This method creates a foreignObject (see https://developer.mozilla.org/en-US/docs/Web/SVG/Element/foreignObject) that allows to embed HTML content into a SVG graphic. With the help of foreignObjects you can enable the usage of regular HTML elements inside of SVG where they are subject for SVG positioning and transformation but the Browser will use the HTML rendering capabilities for the containing DOM.
   * @param content The DOM Node, or HTML string that will be converted to a DOM Node, that is then placed into and wrapped by the foreignObject
   * @param attributes An object with properties that will be added as attributes to the foreignObject element that is created. Attributes with undefined values will not be added.
   * @param className This class or class list will be added to the SVG element
   * @param insertFirst Specifies if the foreignObject should be inserted as first child
   * @return New wrapper object that wraps the foreignObject element
   */
  foreignObject(
    content: string | Node,
    attributes?: Attributes,
    className?: string,
    insertFirst = false
  ) {
    let contentNode: Node;
    // If content is string then we convert it to DOM
    // TODO: Handle case where content is not a string nor a DOM Node
    if (typeof content === 'string') {
      const container = this._node.ownerDocument.createElement('div');
      container.innerHTML = content;
      contentNode = container.firstChild as Node;
    } else {
      contentNode = content;
    }

    if (contentNode instanceof Element) {
      // Adding namespace to content element
      contentNode.setAttribute('xmlns', namespaces.xmlns);
    }

    // Creating the foreignObject without required extension attribute (as described here
    // http://www.w3.org/TR/SVG/extend.html#ForeignObjectElement)
    const fnObj = this.elem(
      'foreignObject',
      attributes,
      className,
      insertFirst
    );

    // Add content to foreignObjectElement
    fnObj._node.appendChild(contentNode);

    return fnObj;
  }

  /**
   * This method adds a new text element to the current Svg wrapper.
   * @param t The text that should be added to the text element that is created
   * @return The same wrapper object that was used to add the newly created element
   */
  text(t: string) {
    this._node.appendChild(this._node.ownerDocument.createTextNode(t));
    return this;
  }

  /**
   * This method will clear all child nodes of the current wrapper object.
   * @return The same wrapper object that got emptied
   */
  empty() {
    while (this._node.firstChild) {
      this._node.removeChild(this._node.firstChild);
    }

    return this;
  }

  /**
   * Removes the element from its parent.
   * @returns The parent it had, wrapped in a new `Svg`, or `null` if it had
   * none or the parent isn't an SVG element.
   */
  remove() {
    const parent = this.parent();
    this._node.parentNode?.removeChild(this._node);
    return parent;
  }

  /**
   * This method will replace the element with a new element that can be created outside of the current DOM.
   * @param newElement The new Svg object that will be used to replace the current wrapper object
   * @return The wrapper of the new element
   */
  replace(newElement: Svg) {
    this._node.parentNode?.replaceChild(newElement._node, this._node);
    return newElement;
  }

  /**
   * This method will append an element to the current element as a child.
   * @param element The Svg element that should be added as a child
   * @param insertFirst Specifies if the element should be inserted as first child
   * @return The wrapper of the appended object
   */
  append(element: Svg, insertFirst = false) {
    if (insertFirst && this._node.firstChild) {
      this._node.insertBefore(element._node, this._node.firstChild);
    } else {
      this._node.appendChild(element._node);
    }

    return this;
  }

  /**
   * Returns an array of class names that are attached to the current wrapper element. This method can not be chained further.
   * @return A list of classes or an empty array if there are no classes on the current element
   */
  classes() {
    const classNames = this._node.getAttribute('class');

    return classNames ? classNames.trim().split(/\s+/) : [];
  }

  /**
   * Adds one or a space separated list of classes to the current element and ensures the classes are only existing once.
   * @param names A white space separated list of class names
   * @return The wrapper of the current element
   */
  addClass(names: string) {
    this._node.setAttribute(
      'class',
      this.classes()
        .concat(names.trim().split(/\s+/))
        .filter(function (elem, pos, self) {
          return self.indexOf(elem) === pos;
        })
        .join(' ')
    );

    return this;
  }

  /**
   * Removes one or a space separated list of classes from the current element.
   * @param names A white space separated list of class names
   * @return The wrapper of the current element
   */
  removeClass(names: string) {
    const removedClasses = names.trim().split(/\s+/);

    this._node.setAttribute(
      'class',
      this.classes()
        .filter(name => removedClasses.indexOf(name) === -1)
        .join(' ')
    );

    return this;
  }

  /**
   * Removes all classes from the current element.
   * @return The wrapper of the current element
   */
  removeAllClasses() {
    this._node.setAttribute('class', '');
    return this;
  }

  /**
   * Get element height using `clientHeight`
   * @return The elements height in pixels
   */
  height() {
    return this._node.clientHeight;
  }

  /**
   * Get element width using `clientWidth`
   * @return The elements width in pixels
   */
  width() {
    return this._node.clientWidth;
  }

  /**
   * Animates attributes of the element with SMIL: adds an `<animate>`
   * element per attribute. Each {@link AnimationDefinition} holds SMIL
   * attributes (usually `begin`, `dur`, `from` and `to`, see
   * https://www.w3.org/TR/SVG11/animate.html), plus an optional `easing`: a
   * name from {@link easings} or four numbers of a cubic Bézier curve.
   *
   * An animations object could look like this:
   * ```ts
   * element.animate({
   *   opacity: {
   *     dur: 1000,
   *     from: 0,
   *     to: 1
   *   },
   *   x1: {
   *     dur: '1000ms',
   *     from: 100,
   *     to: 200,
   *     easing: 'easeOutQuart'
   *   },
   *   y1: {
   *     dur: '2s',
   *     from: 0,
   *     to: 100
   *   }
   * });
   * ```
   *
   * `dur` and `begin` given as numbers are milliseconds.
   *
   * **Guided mode** (the default) makes one-off animations behave: the
   * attribute is set to `from` right away, even before a delayed start; the
   * animation starts after `begin` ms (a timeout, not the document's
   * timeline); and when it ends, the attribute keeps `to` and the
   * `<animate>` element is removed. Pass `guided: false` to write the
   * `<animate>` elements as given. An attribute with an array of
   * definitions never runs guided.
   * @param animations The attributes to animate, each with a definition, or
   * an array of definitions to run several animations on one attribute.
   * @param guided Runs the animations in guided mode (see above).
   * @param eventEmitter Gets `animationBegin` and `animationEnd` events
   * ({@link AnimationEvent}) when an animation starts and ends. With the
   * compat plugin, elements of a chart send them to the chart by default.
   * @returns The same wrapper, for chaining.
   */
  animate(
    animations: Record<string, AnimationDefinition | AnimationDefinition[]>,
    guided = true,
    eventEmitter?: EventEmitter
  ) {
    const emitter = eventEmitter ?? animationEmitterOf(this._node);
    Object.keys(animations).forEach(attribute => {
      const attributeAnimation = animations[attribute];

      // If current attribute is an array of definition objects we create an animate for each and disable guided mode
      if (Array.isArray(attributeAnimation)) {
        attributeAnimation.forEach(animationDefinition =>
          createAnimation(this, attribute, animationDefinition, false, emitter)
        );
      } else {
        createAnimation(this, attribute, attributeAnimation, guided, emitter);
      }
    });

    return this;
  }
}
