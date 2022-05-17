import { extend } from '../core/core';

/**
 * Contains the descriptors of supported element types in a SVG path. Currently only move, line and curve are supported.
 *
 * @memberof SvgPath
 * @type {Object}
 */
const elementDescriptions = {
  m: ['x', 'y'],
  l: ['x', 'y'],
  c: ['x1', 'y1', 'x2', 'y2', 'x', 'y'],
  a: ['rx', 'ry', 'xAr', 'lAf', 'sf', 'x', 'y']
};

/**
 * Default options for newly created SVG path objects.
 *
 * @memberof SvgPath
 * @type {Object}
 */
const defaultOptions = {
  // The accuracy in digit count after the decimal point. This will be used to round numbers in the SVG path. If this option is set to false then no rounding will be performed.
  accuracy: 3
};

function element(command, params, pathElements, pos, relative, data) {
  const pathElement = extend(
    {
      command: relative ? command.toLowerCase() : command.toUpperCase()
    },
    params,
    data ? { data: data } : {}
  );

  pathElements.splice(pos, 0, pathElement);
}

function forEachParam(pathElements, cb) {
  pathElements.forEach((pathElement, pathElementIndex) => {
    elementDescriptions[pathElement.command.toLowerCase()].forEach(
      (paramName, paramIndex) => {
        cb(pathElement, paramName, pathElementIndex, paramIndex, pathElements);
      }
    );
  });
}

/**
 * Used to construct a new path object.
 *
 * @memberof SvgPath
 * @param {Boolean} close If set to true then this path will be closed when stringified (with a Z at the end)
 * @param {Object} options Options object that overrides the default objects. See default options for more details.
 * @constructor
 */
export class SvgPath {
  /**
   * This static function on `SvgPath` is joining multiple paths together into one paths.
   *
   * @memberof SvgPath
   * @param {Array<SvgPath>} paths A list of paths to be joined together. The order is important.
   * @param {boolean} [close] If the newly created path should be a closed path
   * @param {Object} [options] Path options for the newly created path.
   * @return {SvgPath}
   */
  static join(paths, close, options) {
    const joinedPath = new SvgPath(close, options);
    for (let i = 0; i < paths.length; i++) {
      const path = paths[i];
      for (let j = 0; j < path.pathElements.length; j++) {
        joinedPath.pathElements.push(path.pathElements[j]);
      }
    }
    return joinedPath;
  }

  constructor(close, options) {
    this.pathElements = [];
    this.pos = 0;
    this.close = close;
    this.options = extend({}, defaultOptions, options);
  }

  /**
   * Gets or sets the current position (cursor) inside of the path. You can move around the cursor freely but limited to 0 or the count of existing elements. All modifications with element functions will insert new elements at the position of this cursor.
   *
   * @memberof SvgPath
   * @param {Number} [pos] If a number is passed then the cursor is set to this position in the path element array.
   * @return {SvgPath|Number} If the position parameter was passed then the return value will be the path object for easy call chaining. If no position parameter was passed then the current position is returned.
   */
  position(pos) {
    if (pos !== undefined) {
      this.pos = Math.max(0, Math.min(this.pathElements.length, pos));
      return this;
    } else {
      return this.pos;
    }
  }

  /**
   * Removes elements from the path starting at the current position.
   *
   * @memberof SvgPath
   * @param {Number} count Number of path elements that should be removed from the current position.
   * @return {SvgPath} The current path object for easy call chaining.
   */
  remove(count) {
    this.pathElements.splice(this.pos, count);
    return this;
  }

  /**
   * Use this function to add a new move SVG path element.
   *
   * @memberof SvgPath
   * @param {Number} x The x coordinate for the move element.
   * @param {Number} y The y coordinate for the move element.
   * @param {Boolean} [relative] If set to true the move element will be created with relative coordinates (lowercase letter)
   * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
   * @return {SvgPath} The current path object for easy call chaining.
   */
  move(x, y, relative, data) {
    element(
      'M',
      {
        x: +x,
        y: +y
      },
      this.pathElements,
      this.pos++,
      relative,
      data
    );
    return this;
  }

  /**
   * Use this function to add a new line SVG path element.
   *
   * @memberof SvgPath
   * @param {Number} x The x coordinate for the line element.
   * @param {Number} y The y coordinate for the line element.
   * @param {Boolean} [relative] If set to true the line element will be created with relative coordinates (lowercase letter)
   * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
   * @return {SvgPath} The current path object for easy call chaining.
   */
  line(x, y, relative, data) {
    element(
      'L',
      {
        x: +x,
        y: +y
      },
      this.pathElements,
      this.pos++,
      relative,
      data
    );
    return this;
  }

  /**
   * Use this function to add a new curve SVG path element.
   *
   * @memberof SvgPath
   * @param {Number} x1 The x coordinate for the first control point of the bezier curve.
   * @param {Number} y1 The y coordinate for the first control point of the bezier curve.
   * @param {Number} x2 The x coordinate for the second control point of the bezier curve.
   * @param {Number} y2 The y coordinate for the second control point of the bezier curve.
   * @param {Number} x The x coordinate for the target point of the curve element.
   * @param {Number} y The y coordinate for the target point of the curve element.
   * @param {Boolean} [relative] If set to true the curve element will be created with relative coordinates (lowercase letter)
   * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
   * @return {SvgPath} The current path object for easy call chaining.
   */
  curve(x1, y1, x2, y2, x, y, relative, data) {
    element(
      'C',
      {
        x1: +x1,
        y1: +y1,
        x2: +x2,
        y2: +y2,
        x: +x,
        y: +y
      },
      this.pathElements,
      this.pos++,
      relative,
      data
    );
    return this;
  }

  /**
   * Use this function to add a new non-bezier curve SVG path element.
   *
   * @memberof SvgPath
   * @param {Number} rx The radius to be used for the x-axis of the arc.
   * @param {Number} ry The radius to be used for the y-axis of the arc.
   * @param {Number} xAr Defines the orientation of the arc
   * @param {Number} lAf Large arc flag
   * @param {Number} sf Sweep flag
   * @param {Number} x The x coordinate for the target point of the curve element.
   * @param {Number} y The y coordinate for the target point of the curve element.
   * @param {Boolean} [relative] If set to true the curve element will be created with relative coordinates (lowercase letter)
   * @param {*} [data] Any data that should be stored with the element object that will be accessible in pathElement
   * @return {SvgPath} The current path object for easy call chaining.
   */
  arc(rx, ry, xAr, lAf, sf, x, y, relative, data) {
    element(
      'A',
      {
        rx: +rx,
        ry: +ry,
        xAr: +xAr,
        lAf: +lAf,
        sf: +sf,
        x: +x,
        y: +y
      },
      this.pathElements,
      this.pos++,
      relative,
      data
    );
    return this;
  }

  /**
   * Parses an SVG path seen in the d attribute of path elements, and inserts the parsed elements into the existing path object at the current cursor position. Any closing path indicators (Z at the end of the path) will be ignored by the parser as this is provided by the close option in the options of the path object.
   *
   * @memberof SvgPath
   * @param {String} path Any SVG path that contains move (m), line (l) or curve (c) components.
   * @return {SvgPath} The current path object for easy call chaining.
   */
  parse(path) {
    // Parsing the SVG path string into an array of arrays [['M', '10', '10'], ['L', '100', '100']]
    const chunks = path
      .replace(/([A-Za-z])([0-9])/g, '$1 $2')
      .replace(/([0-9])([A-Za-z])/g, '$1 $2')
      .split(/[\s,]+/)
      .reduce((result, pathElement) => {
        if (pathElement.match(/[A-Za-z]/)) {
          result.push([]);
        }

        result[result.length - 1].push(pathElement);
        return result;
      }, []);

    // If this is a closed path we remove the Z at the end because this is determined by the close option
    if (chunks[chunks.length - 1][0].toUpperCase() === 'Z') {
      chunks.pop();
    }

    // Using svgPathElementDescriptions to map raw path arrays into objects that contain the command and the parameters
    // For example {command: 'M', x: '10', y: '10'}
    const elements = chunks.map(chunk => {
      const command = chunk.shift();
      const description = elementDescriptions[command.toLowerCase()];

      return extend(
        {
          command: command
        },
        description.reduce((result, paramName, index) => {
          result[paramName] = +chunk[index];
          return result;
        }, {})
      );
    });

    // Preparing a splice call with the elements array as var arg params and insert the parsed elements at the current position
    this.pathElements.splice(this.pos, 0, ...elements);
    // Increase the internal position by the element count
    this.pos += elements.length;

    return this;
  }

  /**
   * This function renders to current SVG path object into a final SVG string that can be used in the d attribute of SVG path elements. It uses the accuracy option to round big decimals. If the close parameter was set in the constructor of this path object then a path closing Z will be appended to the output string.
   *
   * @memberof SvgPath
   * @return {String}
   */
  stringify() {
    const accuracyMultiplier = Math.pow(10, this.options.accuracy);

    return (
      this.pathElements.reduce((path, pathElement) => {
        const params = elementDescriptions[
          pathElement.command.toLowerCase()
        ].map(paramName =>
          this.options.accuracy
            ? Math.round(pathElement[paramName] * accuracyMultiplier) /
              accuracyMultiplier
            : pathElement[paramName]
        );

        return path + pathElement.command + params.join(',');
      }, '') + (this.close ? 'Z' : '')
    );
  }

  /**
   * Scales all elements in the current SVG path object. There is an individual parameter for each coordinate. Scaling will also be done for control points of curves, affecting the given coordinate.
   *
   * @memberof SvgPath
   * @param {Number} x The number which will be used to scale the x, x1 and x2 of all path elements.
   * @param {Number} y The number which will be used to scale the y, y1 and y2 of all path elements.
   * @return {SvgPath} The current path object for easy call chaining.
   */
  scale(x, y) {
    forEachParam(
      this.pathElements,
      (pathElement, paramName) =>
        (pathElement[paramName] *= paramName[0] === 'x' ? x : y)
    );
    return this;
  }

  /**
   * Translates all elements in the current SVG path object. The translation is relative and there is an individual parameter for each coordinate. Translation will also be done for control points of curves, affecting the given coordinate.
   *
   * @memberof SvgPath
   * @param {Number} x The number which will be used to translate the x, x1 and x2 of all path elements.
   * @param {Number} y The number which will be used to translate the y, y1 and y2 of all path elements.
   * @return {SvgPath} The current path object for easy call chaining.
   */
  translate(x, y) {
    forEachParam(
      this.pathElements,
      (pathElement, paramName) =>
        (pathElement[paramName] += paramName[0] === 'x' ? x : y)
    );
    return this;
  }

  /**
   * This function will run over all existing path elements and then loop over their attributes. The callback function will be called for every path element attribute that exists in the current path.
   * The method signature of the callback function looks like this:
   * ```javascript
   * function(pathElement, paramName, pathElementIndex, paramIndex, pathElements)
   * ```
   * If something else than undefined is returned by the callback function, this value will be used to replace the old value. This allows you to build custom transformations of path objects that can't be achieved using the basic transformation functions scale and translate.
   *
   * @memberof SvgPath
   * @param {Function} transformFnc The callback function for the transformation. Check the signature in the function description.
   * @return {SvgPath} The current path object for easy call chaining.
   */
  transform(transformFnc) {
    forEachParam(
      this.pathElements,
      (pathElement, paramName, pathElementIndex, paramIndex, pathElements) => {
        const transformed = transformFnc(
          pathElement,
          paramName,
          pathElementIndex,
          paramIndex,
          pathElements
        );
        if (transformed || transformed === 0) {
          pathElement[paramName] = transformed;
        }
      }
    );
    return this;
  }

  /**
   * This function clones a whole path object with all its properties. This is a deep clone and path element objects will also be cloned.
   *
   * @memberof SvgPath
   * @param {Boolean} [close] Optional option to set the new cloned path to closed. If not specified or false, the original path close option will be used.
   * @return {SvgPath}
   */
  clone(close) {
    const clone = new SvgPath(close || this.close);
    clone.pos = this.pos;
    clone.pathElements = this.pathElements
      .slice()
      .map(pathElement => extend({}, pathElement));
    clone.options = extend({}, this.options);
    return clone;
  }

  /**
   * Split a Svg.Path object by a specific command in the path chain. The path chain will be split and an array of newly created paths objects will be returned. This is useful if you'd like to split an SVG path by it's move commands, for example, in order to isolate chunks of drawings.
   *
   * @memberof SvgPath
   * @param {String} command The command you'd like to use to split the path
   * @return {Array<SvgPath>}
   */
  splitByCommand(command) {
    const split = [new SvgPath()];

    this.pathElements.forEach(pathElement => {
      if (
        pathElement.command === command.toUpperCase() &&
        split[split.length - 1].pathElements.length !== 0
      ) {
        split.push(new SvgPath());
      }

      split[split.length - 1].pathElements.push(pathElement);
    });

    return split;
  }
}
