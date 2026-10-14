import { Svg } from './Svg';

type SvgMethods = Exclude<
  keyof Svg,
  | 'constructor'
  | 'parent'
  | 'querySelector'
  | 'querySelectorAll'
  | 'replace'
  | 'append'
  | 'classes'
  | 'height'
  | 'width'
>;

type SvgListMethods = {
  [method in SvgMethods]: (...args: Parameters<Svg[method]>) => SvgList;
};

/**
 * A list of {@link Svg} wrappers that calls an `Svg` method on all of them
 * at once, such as `addClass` or `animate`. Each method returns the list,
 * for chaining. {@link Svg.querySelectorAll} returns one.
 */
export class SvgList implements SvgListMethods {
  private svgElements: Svg[] = [];

  /**
   * Wraps each element of the list in an {@link Svg}.
   * @param nodeList An Array of SVG DOM nodes or a SVG DOM NodeList (as returned by document.querySelectorAll)
   */
  constructor(nodeList: ArrayLike<Element>) {
    for (let i = 0; i < nodeList.length; i++) {
      this.svgElements.push(new Svg(nodeList[i]));
    }
  }

  private call<T extends SvgMethods>(method: T, args: Parameters<Svg[T]>) {
    this.svgElements.forEach(element =>
      Reflect.apply(element[method], element, args)
    );
    return this;
  }

  /** Sets attributes on every element, as {@link Svg.attr} does. */
  attr(...args: Parameters<Svg['attr']>) {
    return this.call('attr', args);
  }

  /** Adds a child element to every element, as {@link Svg.elem} does. */
  elem(...args: Parameters<Svg['elem']>) {
    return this.call('elem', args);
  }

  /** Calls {@link Svg.root} on every element; returns the list, not the roots. */
  root(...args: Parameters<Svg['root']>) {
    return this.call('root', args);
  }

  /** Calls {@link Svg.getNode} on every element; returns the list, not the nodes. */
  getNode(...args: Parameters<Svg['getNode']>) {
    return this.call('getNode', args);
  }

  /** Adds a `foreignObject` with the content to every element, as {@link Svg.foreignObject} does. */
  foreignObject(...args: Parameters<Svg['foreignObject']>) {
    return this.call('foreignObject', args);
  }

  /** Adds a text node to every element, as {@link Svg.text} does. */
  text(...args: Parameters<Svg['text']>) {
    return this.call('text', args);
  }

  /** Removes the children of every element, as {@link Svg.empty} does. */
  empty(...args: Parameters<Svg['empty']>) {
    return this.call('empty', args);
  }

  /** Removes every element from its parent, as {@link Svg.remove} does. */
  remove(...args: Parameters<Svg['remove']>) {
    return this.call('remove', args);
  }

  /** Adds classes to every element, as {@link Svg.addClass} does. */
  addClass(...args: Parameters<Svg['addClass']>) {
    return this.call('addClass', args);
  }

  /** Removes classes from every element, as {@link Svg.removeClass} does. */
  removeClass(...args: Parameters<Svg['removeClass']>) {
    return this.call('removeClass', args);
  }

  /** Removes all classes from every element, as {@link Svg.removeAllClasses} does. */
  removeAllClasses(...args: Parameters<Svg['removeAllClasses']>) {
    return this.call('removeAllClasses', args);
  }

  /** Animates attributes of every element with SMIL, as {@link Svg.animate} does. */
  animate(...args: Parameters<Svg['animate']>) {
    return this.call('animate', args);
  }
}
