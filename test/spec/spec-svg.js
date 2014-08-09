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
    expect(svg._node).toBeDefined();
    expect(svg._node.nodeName.toLowerCase()).toBe('svg');
  });

  it('should create a valid svg dom element with attributes', function () {
    var svg = window.Chartist.Svg('svg', {
      width: '100%',
      height: '100%'
    });

    expect(svg).toBeDefined();
    expect(svg._node).toBeDefined();
    expect(svg._node.nodeName.toLowerCase()).toBe('svg');
    expect(svg._node.attributes.width.textContent).toBe('100%');
    expect(svg._node.attributes.height.textContent).toBe('100%');
  });

  it('should create nested objects with attributes', function () {
    var svg = window.Chartist.Svg('svg');
    svg.elem('g').elem('g').elem('circle', {
      cx: 100,
      cy: 100,
      r: 10
    });

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild.firstChild.firstChild).toBeDefined();
    expect(svg._node.firstChild.firstChild.firstChild.attributes.cx.textContent).toBe('100');
    expect(svg._node.firstChild.firstChild.firstChild.attributes.cy.textContent).toBe('100');
    expect(svg._node.firstChild.firstChild.firstChild.attributes.r.textContent).toBe('10');
  });

  it('should allow to set attributes manually', function () {
    var svg = window.Chartist.Svg('svg');
    svg.elem('circle').attr({
      cx: 100,
      cy: 100,
      r: 10
    });

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild).toBeDefined();
    expect(svg._node.firstChild.attributes.cx.textContent).toBe('100');
    expect(svg._node.firstChild.attributes.cy.textContent).toBe('100');
    expect(svg._node.firstChild.attributes.r.textContent).toBe('10');
  });

  it('should clear on each nesting level', function () {
    var svg = window.Chartist.Svg('svg');
    var group = svg.elem('g');
    group.elem('circle');
    group.elem('circle');
    group.elem('circle');

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild.childNodes.length).toBe(3);

    group.empty();
    expect(svg._node.firstChild.childNodes.length).toBe(0);

    svg.empty();
    expect(svg._node.firstChild).toBeNull();
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

    expect(svg._node).toBeDefined();
    expect(svg._node.attributes.width.textContent).toBe('100%');
    expect(svg._node.attributes.height.textContent).toBe('100%');

    expect(svg._node.firstChild).toBeDefined();
    expect(svg._node.firstChild.attributes.transform.textContent).toBe('rotate(30 30 30)');

    expect(svg._node.firstChild.firstChild).toBeDefined();
    expect(svg._node.firstChild.firstChild.attributes.transform.textContent).toBe('rotate(20 20 20)');

    expect(svg._node.firstChild.firstChild.firstChild).toBeDefined();
    expect(svg._node.firstChild.firstChild.firstChild.attributes.transform.textContent).toBe('rotate(10 10 10)');
  });
});