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
      expect(input).toMatch(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize dates', function() {
      var input = new Date(0);
      expect(+input).toMatch(+new Date(Chartist.deserialize(Chartist.serialize(input))));
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

      expect(input).toMatch(Chartist.deserialize(Chartist.serialize(input)));
    });

    it('should serialize and deserialize null, undefined and NaN', function() {
      expect(null).toMatch(Chartist.deserialize(Chartist.serialize(null)));
      expect(undefined).toMatch(Chartist.deserialize(Chartist.serialize(undefined)));
      expect(NaN).toMatch(Chartist.deserialize(Chartist.serialize('NaN')));
    });
  });
});
