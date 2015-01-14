describe('Chartist core', function() {
  'use strict';

  beforeEach(function() {

  });

  afterEach(function() {

  });

  describe('createSvg tests', function () {
    it('should not remove non-chartist svg elements', function() {
      $('body').append('<div id="chart-container"><svg id="foo"></svg><div><svg id="bar"></svg></div></div>');

      var container = $('#chart-container'),
        childSvg = $('#chart-container #foo'),
        nestedChildSvg = $('#chart-container #bar'),

        // We use get(0) because we want the DOMElement, not the jQuery object.
        svg = Chartist.createSvg(container.get(0), '500px', '400px', 'ct-fish-bar');

      expect(svg).toBeDefined();
      expect(childSvg.length).toEqual(1);
      expect(nestedChildSvg.length).toEqual(1);
    });
  });
});
