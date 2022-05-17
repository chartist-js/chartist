import { Svg } from './svg';
import { namespaces } from '../core/globals';

describe('Svg', () => {
  it('should create a valid svg dom element', () => {
    const svg = new Svg('svg');

    expect(svg).toBeDefined();
    expect(svg._node).toBeDefined();
    expect(svg._node.nodeName.toLowerCase()).toBe('svg');
  });

  it('should create a valid svg dom element with attributes', () => {
    const svg = new Svg('svg', {
      width: '100%',
      height: '100%'
    });

    expect(svg).toBeDefined();
    expect(svg._node).toBeDefined();
    expect(svg._node.nodeName.toLowerCase()).toBe('svg');
    expect(svg._node.attributes.width).toHaveTextContent('100%');
    expect(svg._node.attributes.height).toHaveTextContent('100%');
  });

  it('should create nested objects with attributes', () => {
    const svg = new Svg('svg');
    svg.elem('g').elem('g').elem('circle', {
      cx: 100,
      cy: 100,
      r: 10
    });

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild.firstChild.firstChild).toBeDefined();
    expect(
      svg._node.firstChild.firstChild.firstChild.attributes.cx
    ).toHaveTextContent('100');
    expect(
      svg._node.firstChild.firstChild.firstChild.attributes.cy
    ).toHaveTextContent('100');
    expect(
      svg._node.firstChild.firstChild.firstChild.attributes.r
    ).toHaveTextContent('10');
  });

  it('should allow to set attributes manually', () => {
    const svg = new Svg('svg');
    svg.elem('circle').attr({
      cx: 100,
      cy: 100,
      r: 10
    });

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild).toBeDefined();
    expect(svg._node.firstChild.attributes.cx).toHaveTextContent('100');
    expect(svg._node.firstChild.attributes.cy).toHaveTextContent('100');
    expect(svg._node.firstChild.attributes.r).toHaveTextContent('10');
  });

  it('should allow to set namespaced attributes', () => {
    const svg = new Svg('image');
    svg.elem('image').attr({
      x: 100,
      y: 100,
      height: 100,
      width: 100,
      'xlink:href': 'image.jpg'
    });

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild).toBeDefined();
    expect(svg._node.firstChild).toHaveAttribute('x', '100');
    expect(svg._node.firstChild).toHaveAttribute('y', '100');
    expect(svg._node.firstChild).toHaveAttribute('width', '100');
    expect(svg._node.firstChild).toHaveAttribute('height', '100');
    expect(svg._node.firstChild.getAttributeNS(namespaces.xlink, 'href')).toBe(
      'image.jpg'
    );
  });

  it('should clear on each nesting level', () => {
    const svg = new Svg('svg');
    const group = svg.elem('g');
    group.elem('circle');
    group.elem('circle');
    group.elem('circle');

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild.childNodes.length).toBe(3);

    group.empty();
    expect(svg._node.firstChild.childNodes.length).toBe(0);

    svg.empty();
    expect(svg._node).toBeEmptyDOMElement();
  });

  it('should allow to remove a certain element', () => {
    const svg = new Svg('svg');
    const text = svg.elem('text');

    expect(svg._node).toBeDefined();
    expect(svg._node.childNodes.length).toBe(1);
    expect(svg._node.firstChild.nodeName.toLowerCase()).toBe('text');

    text.remove();
    expect(svg._node.childNodes.length).toBe(0);
  });

  it('should allow to write text content into elements', () => {
    const svg = new Svg('svg');
    svg.elem('text').text('Hello World');

    expect(svg._node).toBeDefined();
    expect(svg._node.childNodes.length).toBe(1);
    expect(svg._node.firstChild.nodeName.toLowerCase()).toBe('text');
    expect(svg._node.firstChild.firstChild.nodeType).toBe(3);
    expect(svg._node.firstChild.firstChild).toHaveTextContent('Hello World');
  });

  it('should allow to add and remove classes on elements', () => {
    const svg = new Svg('svg')
      .addClass('test-class-1')
      .addClass('test-class-2')
      // Should not allow duplicates
      .addClass('test-class-2')
      // Should allow multiple classes with white spaces
      .addClass('test-class-3      test-class-4');

    expect(svg._node).toBeDefined();
    expect(svg._node.getAttribute('class').split(' ')).toEqual([
      'test-class-1',
      'test-class-2',
      'test-class-3',
      'test-class-4'
    ]);

    svg.removeClass('test-class-1');
    // Should allow multiple classes with whitespaces
    svg.removeClass('test-class-2        test-class-3');

    expect(svg._node).toHaveAttribute('class', 'test-class-4');
  });

  it('should allow to travers up in the fluent API chain and set attributes on the way', () => {
    const svg = new Svg('svg');
    svg
      .elem('g')
      .elem('g')
      .elem('g')
      .elem('circle')
      .parent()
      .attr({
        transform: 'rotate(10 10 10)'
      })
      .parent()
      .attr({
        transform: 'rotate(20 20 20)'
      })
      .parent()
      .attr({
        transform: 'rotate(30 30 30)'
      })
      .parent()
      .attr({
        width: '100%',
        height: '100%'
      });

    expect(svg._node).toBeDefined();
    expect(svg._node.attributes.width).toHaveTextContent('100%');
    expect(svg._node.attributes.height).toHaveTextContent('100%');

    expect(svg._node.firstChild).toBeDefined();
    expect(svg._node.firstChild.attributes.transform).toHaveTextContent(
      'rotate(30 30 30)'
    );

    expect(svg._node.firstChild.firstChild).toBeDefined();
    expect(
      svg._node.firstChild.firstChild.attributes.transform
    ).toHaveTextContent('rotate(20 20 20)');

    expect(svg._node.firstChild.firstChild.firstChild).toBeDefined();
    expect(
      svg._node.firstChild.firstChild.firstChild.attributes.transform
    ).toHaveTextContent('rotate(10 10 10)');
  });
});
