import {Svg} from './svg';

/**
 * This helper class is to wrap multiple `Svg` elements into a list where you can call the `Svg` functions on all elements in the list with one call. This is helpful when you'd like to perform calls with `Svg` on multiple elements.
 * An instance of this class is also returned by `Svg.querySelectorAll`.
 *
 * @memberof Svg
 * @param {Array<Node>|NodeList} nodeList An Array of SVG DOM nodes or a SVG DOM NodeList (as returned by document.querySelectorAll)
 * @constructor
 */
export class SvgList {
  constructor(nodeList) {
    const list = this;

    this.svgElements = [];
    for(let i = 0; i < nodeList.length; i++) {
      this.svgElements.push(new Svg(nodeList[i]));
    }

    // Add delegation methods for Svg
    Object.keys(Svg.prototype).filter((prototypeProperty) => [
      'constructor',
      'parent',
      'querySelector',
      'querySelectorAll',
      'replace',
      'append',
      'classes',
      'height',
      'width'
    ].indexOf(prototypeProperty) === -1)
      .forEach((prototypeProperty) => {
        list[prototypeProperty] = () => {
          const args = Array.from(arguments);
          list.svgElements.forEach((element) =>
            Svg.prototype[prototypeProperty].apply(element, args));
          return list;
        };
      });
  }
}
