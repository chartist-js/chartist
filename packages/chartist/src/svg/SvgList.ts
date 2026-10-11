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
 * This helper class is to wrap multiple `Svg` elements into a list where you can call the `Svg` functions on all elements in the list with one call. This is helpful when you'd like to perform calls with `Svg` on multiple elements.
 * An instance of this class is also returned by `Svg.querySelectorAll`.
 */
export class SvgList implements SvgListMethods {
  private svgElements: Svg[] = [];

  /**
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

  attr(...args: Parameters<Svg['attr']>) {
    return this.call('attr', args);
  }

  elem(...args: Parameters<Svg['elem']>) {
    return this.call('elem', args);
  }

  root(...args: Parameters<Svg['root']>) {
    return this.call('root', args);
  }

  getNode(...args: Parameters<Svg['getNode']>) {
    return this.call('getNode', args);
  }

  foreignObject(...args: Parameters<Svg['foreignObject']>) {
    return this.call('foreignObject', args);
  }

  text(...args: Parameters<Svg['text']>) {
    return this.call('text', args);
  }

  empty(...args: Parameters<Svg['empty']>) {
    return this.call('empty', args);
  }

  remove(...args: Parameters<Svg['remove']>) {
    return this.call('remove', args);
  }

  addClass(...args: Parameters<Svg['addClass']>) {
    return this.call('addClass', args);
  }

  removeClass(...args: Parameters<Svg['removeClass']>) {
    return this.call('removeClass', args);
  }

  removeAllClasses(...args: Parameters<Svg['removeAllClasses']>) {
    return this.call('removeAllClasses', args);
  }

  animate(...args: Parameters<Svg['animate']>) {
    return this.call('animate', args);
  }
}
