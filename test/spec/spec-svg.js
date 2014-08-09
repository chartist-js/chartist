//TODO: Add tests!
describe('Chartist SVG', function () {
  'use strict';

  beforeEach(function () {

  });

  afterEach(function () {

  });

  it('should exist in global namespace', function () {
    expect(window.Chartist.Svg).toBeDefined();
  });

  it('should create a valid svg dom element', function () {
    var svg = window.Chartist.Svg('svg');

    expect(svg).toBeDefined();
    expect(svg.node).toBeDefined();
    expect(svg.node.nodeName.toLowerCase()).toBe('svg');
  });

  it('should create a valid svg dom element with attributes', function () {
    var svg = window.Chartist.Svg('svg', {
      width: '100%',
      height: '100%'
    });

    expect(svg).toBeDefined();
    expect(svg.node).toBeDefined();
    expect(svg.node.nodeName.toLowerCase()).toBe('svg');
    expect(svg.node.attributes.width.textContent).toBe('100%');
    expect(svg.node.attributes.height.textContent).toBe('100%');
  });

  it('should create nested objects with attributes', function () {
    var svg = window.Chartist.Svg('svg');
    svg.elem('g').elem('g').elem('circle', {
      cx: 100,
      cy: 100,
      r: 10
    });

    expect(svg.node).toBeDefined();
    expect(svg.node.firstChild.firstChild.firstChild).toBeDefined();
    expect(svg.node.firstChild.firstChild.firstChild.attributes.cx.textContent).toBe('100');
    expect(svg.node.firstChild.firstChild.firstChild.attributes.cy.textContent).toBe('100');
    expect(svg.node.firstChild.firstChild.firstChild.attributes.r.textContent).toBe('10');
  });

  it('should allow to set attributes manually', function () {
    var svg = window.Chartist.Svg('svg');
    svg.elem('circle').attr({
      cx: 100,
      cy: 100,
      r: 10
    });

    expect(svg.node).toBeDefined();
    expect(svg.node.firstChild).toBeDefined();
    expect(svg.node.firstChild.attributes.cx.textContent).toBe('100');
    expect(svg.node.firstChild.attributes.cy.textContent).toBe('100');
    expect(svg.node.firstChild.attributes.r.textContent).toBe('10');
  });

  it('should allow to travers up in the fluent API chain and set attributes on the way', function () {
    var svg = window.Chartist.Svg('svg');
    svg.elem('g').elem('g').elem('g').elem('circle')
      .parent().attr({
        transform: 'rotate(10 10 10)'
      })
      .parent().attr({
        transform: 'rotate(20 20 20)'
      })
      .parent().attr({
        transform: 'rotate(30 30 30)'
      })
      .parent().attr({
        width: '100%',
        height: '100%'
      });

    expect(svg.node).toBeDefined();
    expect(svg.node.attributes.width.textContent).toBe('100%');
    expect(svg.node.attributes.height.textContent).toBe('100%');

    expect(svg.node.firstChild).toBeDefined();
    expect(svg.node.firstChild.attributes.transform.textContent).toBe('rotate(30 30 30)');

    expect(svg.node.firstChild.firstChild).toBeDefined();
    expect(svg.node.firstChild.firstChild.attributes.transform.textContent).toBe('rotate(20 20 20)');

    expect(svg.node.firstChild.firstChild.firstChild).toBeDefined();
    expect(svg.node.firstChild.firstChild.firstChild.attributes.transform.textContent).toBe('rotate(10 10 10)');
  });
});