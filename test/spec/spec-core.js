describe('Chartist core', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

  });

  describe('createSvg tests', function () {
    it('should not remove non-chartist svg elements', function() {
      jasmine.getFixtures().set('<div id="chart-container"><svg id="foo"></svg><div><svg id="bar"></svg></div></div>');

      var container = $('#chart-container'),
        // We use get(0) because we want the DOMElement, not the jQuery object.
        svg = Chartist.createSvg(container.get(0), '500px', '400px', 'ct-fish-bar');

      expect(svg).toBeDefined();
      expect(svg.classes()).toContain('ct-fish-bar');
      expect(container).toContainElement('#foo');
      expect(container).toContainElement('#bar');
    });

    it('should remove previous chartist svg elements', function() {
      jasmine.getFixtures().set('<div id="chart-container"></div>');

      var container = $('#chart-container'),
        // We use get(0) because we want the DOMElement, not the jQuery object.
        svg1 = Chartist.createSvg(container.get(0), '500px', '400px', 'ct-fish-bar'),
        svg2 = Chartist.createSvg(container.get(0), '800px', '200px', 'ct-snake-bar');

      expect(svg1).toBeDefined();
      expect(svg1.classes()).toContain('ct-fish-bar');
      expect(svg2).toBeDefined();
      expect(svg2.classes()).toContain('ct-snake-bar');
      expect(container).not.toContainElement('.ct-fish-bar');
      expect(container).toContainElement('.ct-snake-bar');
    });
  });

  describe('serialization tests', function () {
    it('should serialize and deserialize regular strings', function() {
      var input = 'String test';
      expect(input).toMatch(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize strings with critical characters', function() {
      var input = 'String test with critical characters " < > \' & &amp;';
      expect(input).toMatch(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize numbers', function() {
      var input = 12345.6789;
      expect(input).toEqual(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize dates', function() {
      var input = new Date(0);
      expect(+input).toEqual(+new Date(Chartist.deserialize(Chartist.serialize(input))));
    });

    it('should serialize and deserialize complex object types', function() {
      var input = {
        a: {
          b: 100,
          c: 'String test',
          d: 'String test with critical characters " < > \' & &amp;',
          e: {
            f: 'String test'
          }
        }
      };

      expect(input).toEqual(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize null, undefined and NaN', function() {
      expect(null).toEqual(Chartist.deserialize(Chartist.serialize(null)));
      expect(undefined).toEqual(Chartist.deserialize(Chartist.serialize(undefined)));
      expect(NaN).toMatch(Chartist.deserialize(Chartist.serialize('NaN')));
    });
  });

  describe('data normalization tests', function () {

    it('normalize mixed series types correctly', function() {
      var data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: [1, 0, 3, 4, 5, 6]},
          [1, {value: 0}, 3, {value: 4}, 5, 6, 7, 8],
          {data: [1, 0, {value: 3}]}
        ]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]
      );
    });

    it('normalize mixed series for pie chart correctly', function() {
      var data = {
        series: [1, {value: 0}, 3, {value: 4}, 5, 6, 7, 8]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [1, 0, 3, 4, 5, 6, 7, 8]
      );
    });

    it('normalize mixed series with string values for pie chart correctly', function() {
      var data = {
        series: ['1', {value: '0'}, '3', {value: '4'}, '5', '6', '7', '8']
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [1, 0, 3, 4, 5, 6, 7, 8]
      );
    });

    it('normalize mixed series types with string values correctly', function() {
      var data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: ['1', '0', '3', '4', '5', '6']},
          ['1', {value: '0'}, '3', {value: '4'}, '5', '6', '7', '8'],
          {data: ['1', '0', {value: '3'}]}
        ]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [
          [1, 0, 3, 4, 5, 6],
          [1, 0, 3, 4, 5, 6, 7, 8],
          [1, 0, 3]
        ]
      );
    });

    it('normalize mixed series types with weird values correctly', function() {
      var data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          {data: [null, NaN, undefined, '4', '5', '6']},
          ['1', {value: null}, '3', {value: NaN}, '5', '6', '7', '8'],
          {data: ['1', '0', {value: undefined}]}
        ]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [
          [undefined, undefined, undefined, 4, 5, 6],
          [1, undefined, 3, undefined, 5, 6, 7, 8],
          [1, 0, undefined]
        ]
      );
    });

    it('should normalize correctly with 0 values in data series array objects', function() {
      var data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{
          data: [
            { value: 1 },
            { value: 4 },
            { value: 2 },
            { value: 7 },
            { value: 2 },
            { value: 0 }
          ]
        }]
      };

      expect(Chartist.getDataArray(data)).toEqual(
        [[1, 4, 2, 7, 2, 0]]
      );
    });

    it('should normalize correctly with mixed dimensional input into multi dimensional output', function() {
      var data = {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        series: [{
          data: [
            { value: 1 },
            { value: {y: 4, x: 1}},
            { y: 2, x: 2},
            NaN,
            null,
            { value: 7 },
            { value: 2 },
            { value: null },
            { y: undefined, x: NaN }
          ]
        }]
      };

      expect(Chartist.getDataArray(data, false, true)).toEqual(
        [[
          {x: undefined, y: 1},
          {x: 1, y: 4},
          {x: 2, y: 2},
          undefined,
          undefined,
          {x: undefined, y: 7},
          {x: undefined, y: 2},
          undefined,
          {x: undefined, y: undefined}
        ]]
      );
    });
  });

  describe('padding normalization tests', function () {
    it('should normalize number padding', function() {
      expect(Chartist.normalizePadding(10)).toEqual({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      });
    });

    it('should normalize number padding when 0 is passed', function() {
      expect(Chartist.normalizePadding(0)).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      });
    });

    it('should normalize empty padding object with default fallback', function() {
      expect(Chartist.normalizePadding({})).toEqual({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      });
    });

    it('should normalize empty padding object with specified fallback', function() {
      expect(Chartist.normalizePadding({}, 10)).toEqual({
        top: 10,
        right: 10,
        bottom: 10,
        left: 10
      });
    });

    it('should normalize partial padding object with specified fallback', function() {
      expect(Chartist.normalizePadding({
        top: 5,
        left: 5
      }, 10)).toEqual({
        top: 5,
        right: 10,
        bottom: 10,
        left: 5
      });
    });

    it('should not modify complete padding object', function() {
      expect(Chartist.normalizePadding({
        top: 5,
        right: 5,
        bottom: 5,
        left: 5
      }, 10)).toEqual({
        top: 5,
        right: 5,
        bottom: 5,
        left: 5
      });
    });
  });
  
  describe('quantity', function() {
    
    it('should return value for numbers', function() {
      expect(Chartist.quantity(100)).toEqual({ value: 100 });
      expect(Chartist.quantity(0)).toEqual({ value: 0 });
      expect(Chartist.quantity(NaN)).toEqual({ value: NaN });
      expect(Chartist.quantity(null)).toEqual({ value: null });
      expect(Chartist.quantity(undefined)).toEqual({ value: undefined });
    });
    
    it('should return value without unit from string', function() {
      expect(Chartist.quantity('100')).toEqual({ value: 100, unit : undefined });
      expect(Chartist.quantity('0')).toEqual({ value: 0, unit : undefined });
    });
    
    it('should return value and unit from string', function() {
      expect(Chartist.quantity('100%')).toEqual({ value: 100, unit :'%' });
      expect(Chartist.quantity('100 %')).toEqual({ value: 100, unit :'%' });
      expect(Chartist.quantity('0px')).toEqual({ value: 0, unit: 'px' });
    });
    
  });
  
  describe('getBounds', function() {
    
    it('should return 10 steps', function() {
      var bounds = Chartist.getBounds(100, { high: 10, low: 1 }, 10, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(10);
      expect(bounds.values).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });  

    it('should return 5 steps', function() {
      var bounds = Chartist.getBounds(100, { high: 10, low: 1 }, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(10);
      expect(bounds.values).toEqual([1, 3, 5, 7, 9]);
      // Is this correct behaviour? Should it include 10?
    });  
    
    it('should return non integer steps', function() {
      var bounds = Chartist.getBounds(100, { high: 2, low: 1 }, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(2);
      expect(bounds.values).toEqual([ 1, 1.25, 1.5, 1.75, 2 ]);
    });
    
    it('should return integer steps only', function() {
      var bounds = Chartist.getBounds(100, { high: 3, low: 1 }, 20, true);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(3);
      expect(bounds.values).toEqual([ 1, 2, 3 ]);
    });
    
    it('should return single integer step', function() {
      var bounds = Chartist.getBounds(100, { high: 2, low: 1 }, 20, true);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(2);
      expect(bounds.values).toEqual([ 1, 2,]);
    });
    
    it('should floor/ceil min/max', function() {
      var bounds = Chartist.getBounds(100, { high: 9.9, low: 1.01 }, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(10);
      expect(bounds.values).toEqual([1, 3, 5, 7, 9]);
      // Is this correct behaviour? Should it include 10?
    });
    
    it('should floor/ceil min/max for non integers', function() {
      var bounds = Chartist.getBounds(100, { high: 2.9, low: 1.01 }, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(3);
      expect(bounds.values).toEqual([1, 1.5, 2, 2.5, 3]);
    });
    
    it('should floor/ceil min/max if integers only', function() {
      var bounds = Chartist.getBounds(100, { high: 2.9, low: 1.01 }, 20, true);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(3);
      expect(bounds.values).toEqual([1, 2, 3]);
    });
    
    it('should return neg and pos values', function() {
      var bounds = Chartist.getBounds(100, { high: 1.9, low: -0.9 }, 20, false);
      expect(bounds.min).toBe(-1);
      expect(bounds.max).toBe(2);
      expect(bounds.values).toEqual([-1, 0, 1, 2]);
    });
    
    it('should return two steps if no space', function() {
      var bounds = Chartist.getBounds(100, { high: 5, low: 0 }, 45, false);
      expect(bounds.min).toBe(0);
      expect(bounds.max).toBe(5);
      expect(bounds.values).toEqual([0, 4]);
      // Is this correct behaviour? Should it be [0, 5]?
    });
    
    it('should return single step if no space', function() {
      var bounds = Chartist.getBounds(100, { high: 5, low: 0 }, 80, false);
      expect(bounds.min).toBe(0);
      expect(bounds.max).toBe(5);
      expect(bounds.values).toEqual([0]);
      // Is this correct behaviour? Should it be [0, 5]?
    });
      
    it('should return single step if range is less than epsilon', function() {
      var bounds = Chartist.getBounds(100, { high: 1.0000000000000002, low: 1 }, 20, false);
      expect(bounds.min).toBe(1);
      expect(bounds.max).toBe(1.0000000000000002);
      expect(bounds.low).toBe(1);
      expect(bounds.high).toBe(1.0000000000000002);
      expect(bounds.values).toEqual([1]);
    });
    
    it('should return single step if range is less than smallest increment', function() {
      var bounds = Chartist.getBounds(613.234375, { high: 1000.0000000000001, low: 999.9999999999997 }, 50, false);
      expect(bounds.min).toBe(999.9999999999999);
      expect(bounds.max).toBe(1000);
      expect(bounds.low).toBe(999.9999999999997);
      expect(bounds.high).toBe(1000.0000000000001);
      expect(bounds.values).toEqual([999.9999999999999]);
    });

  });

  describe('splitIntoSegments', function() {

    function makeValues(arr) {
      return arr.map(function(x) {
        return { value: x };
      });
    }

    it('should return empty array for empty input', function() {
      expect(Chartist.splitIntoSegments([],[])).toEqual([]);
    });

    it('should remove undefined values', function() {
      var coords = [1,2,3,4,5,6,7,8,9,10,11,12];
      var values = makeValues([1,undefined,undefined,4,undefined,6]);

      expect(Chartist.splitIntoSegments(coords, values)).toEqual([{
        pathCoordinates: [1,2],
        valueData: makeValues([1])
      }, {
        pathCoordinates: [7, 8],
        valueData: makeValues([4])
      }, {
        pathCoordinates: [11, 12],
        valueData: makeValues([6])
      }]);
    });

    it('should respect fillHoles option', function() {
      var coords = [1,2,3,4,5,6,7,8,9,10,11,12];
      var values = makeValues([1,undefined,undefined,4,undefined,6]);
      var options = {
        fillHoles: true
      };

      expect(Chartist.splitIntoSegments(coords, values, options)).toEqual([{
        pathCoordinates: [1,2,7,8,11,12],
        valueData: makeValues([1,4,6])
      }]);
    });

    it('should respect increasingX option', function() {
      var coords = [1,2,3,4,5,6,5,6,7,8,1,2];
      var values = makeValues([1,2,3,4,5,6]);
      var options = {
        increasingX: true
      };

      expect(Chartist.splitIntoSegments(coords, values, options)).toEqual([{
        pathCoordinates: [1,2,3,4,5,6],
        valueData: makeValues([1,2,3])
      }, {
        pathCoordinates: [5,6,7,8],
        valueData: makeValues([4,5])
      }, {
        pathCoordinates: [1,2],
        valueData: makeValues([6])
      }]);
    });
  });

  describe('createGrid', function() {
    var group, axis, classes, eventEmitter, position, length, offset;

    beforeEach(function() {
      eventEmitter = Chartist.EventEmitter();
      group = new Chartist.Svg('g');
      axis = {
        units: {
          pos : 'x'
        },
        counterUnits: {
          pos : 'y'
        }
      }; 
      classes = [];
      position = 10;
      length = 100;
      offset = 20;
    });

    function onCreated(fn, done) {
      eventEmitter.addEventHandler('draw', function(grid) {
        fn(grid);
        done();
      });
      Chartist.createGrid(position, 1, axis, offset, length, group, classes, eventEmitter);
    }

    it('should add single grid line to group', function(done) {
      onCreated(function() {
        expect(group.querySelectorAll('line').svgElements.length).toBe(1);
      }, done);            
    });

    it('should draw line', function(done) {
      onCreated(function() {
        var line = group.querySelector('line');
        expect(line.attr('x1')).toBe('10');
        expect(line.attr('x2')).toBe('10');
        expect(line.attr('y1')).toBe('20');
        expect(line.attr('y2')).toBe('120');
      }, done);
    });

    it('should draw horizontal line', function(done) {
      axis.units.pos = 'y';
      axis.counterUnits.pos = 'x';
      onCreated(function() {
        var line = group.querySelector('line');
        expect(line.attr('y1')).toBe('10');
        expect(line.attr('y2')).toBe('10');
        expect(line.attr('x1')).toBe('20');
        expect(line.attr('x2')).toBe('120');
      }, done);
    });

  });

  describe('createGridBackground', function() {
    var group, chartRect, className, eventEmitter;

    beforeEach(function() {
      eventEmitter = Chartist.EventEmitter();
      group = new Chartist.Svg('g');
      className = 'ct-test';
      chartRect = {
        x1 : 5, 
        y2 : 10,
        _width : 100,
        _height : 50,
        width : function() { return this._width; },
        height : function() { return this._height; },
      };
    });

    function onCreated(fn, done) {
      eventEmitter.addEventHandler('draw', function(data) {
        fn(data);
        done();
      });
      Chartist.createGridBackground(group, chartRect, className, eventEmitter);
    }

    it('should add rect', function(done) {
      onCreated(function() {
        var rects = group.querySelectorAll('rect').svgElements;        
        expect(rects.length).toBe(1);
        var rect = rects[0];
        expect(rect.attr('x')).toBe('5');
        expect(rect.attr('y')).toBe('10');
        expect(rect.attr('width')).toBe('100');
        expect(rect.attr('height')).toBe('50');
        expect(rect.classes()).toEqual(['ct-test']);
      }, done);            
    });

    it('should pass grid to event', function(done) {
      onCreated(function(data) {
        expect(data.type).toBe('gridBackground');
        var rect = data.element;        
        expect(rect.attr('x')).toBe('5');
        expect(rect.attr('y')).toBe('10');
      }, done);
    });


  });
});
