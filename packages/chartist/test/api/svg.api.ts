import { Svg, SvgList, SvgPath, easings } from 'chartist';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CT_NS = 'http://gionkunz.github.com/chartist-js/ct';

describe('Svg (standalone, without a chart)', () => {
  test('creates SVG elements with attributes and classes', () => {
    const svg = new Svg('svg', { width: 100, height: '50%' }, 'my-svg  other');
    const node = svg.getNode();
    expect(node.namespaceURI).toBe(SVG_NS);
    expect(node.getAttribute('width')).toBe('100');
    expect(node.getAttribute('height')).toBe('50%');
    expect(svg.classes()).toEqual(['my-svg', 'other']);
    expect(node.getAttribute('xmlns:ct')).toBe(CT_NS);
  });

  test('wraps an existing element', () => {
    const element = document.createElementNS(SVG_NS, 'g');
    expect(new Svg(element).getNode()).toBe(element);
  });

  test('builds a tree with elem, append and insertFirst', () => {
    const root = new Svg('svg');
    const group = root.elem('g', { id: 'g' }, 'group');
    group.elem('line', { x1: 1 }, 'second');
    group.elem('line', { x1: 0 }, 'first', true);
    root.append(new Svg('rect'), true);
    expect(
      Array.from(root.getNode().querySelectorAll('*'), el => el.tagName)
    ).toEqual(['rect', 'g', 'line', 'line']);
    expect(group.querySelector('.first')!.attr('x1')).toBe('0');
  });

  test('attributes: set, read, skip undefined, namespaced ct:', () => {
    const svg = new Svg('line').attr({ x1: 1, y1: undefined, 'ct:value': 5 });
    expect(svg.attr('x1')).toBe('1');
    expect(svg.getNode().hasAttribute('y1')).toBe(false);
    expect(svg.getNode().getAttributeNS(CT_NS, 'value')).toBe('5');
  });

  test('classes: add, remove, remove all', () => {
    const svg = new Svg('g', {}, 'a');
    svg.addClass('b c').addClass('a');
    expect(svg.classes()).toEqual(['a', 'b', 'c']);
    svg.removeClass('b');
    expect(svg.classes()).toEqual(['a', 'c']);
    svg.removeAllClasses();
    expect(svg.classes()).toEqual([]);
  });

  test('text, empty, remove and replace', () => {
    const root = new Svg('svg');
    const text = root.elem('text').text('Hello');
    expect(text.getNode().textContent).toBe('Hello');

    const group = root.elem('g');
    group.elem('line');
    group.empty();
    expect(group.getNode().childNodes).toHaveLength(0);

    const old = root.elem('line', {}, 'old');
    old.replace(new Svg('circle', {}, 'new'));
    expect(root.querySelector('.old')).toBeNull();
    expect(root.querySelector('.new')).not.toBeNull();

    root.querySelector('.new')!.remove();
    expect(root.querySelector('.new')).toBeNull();
  });

  test('parent, root, querySelector and querySelectorAll', () => {
    const root = new Svg('svg');
    const line = root.elem('g', {}, 'g').elem('line', {}, 'l');
    expect(line.parent()!.getNode()).toBe(root.querySelector('.g')!.getNode());
    expect(line.root().getNode()).toBe(root.getNode());
    expect(root.querySelector('.missing')).toBeNull();
    expect(root.querySelectorAll('line')).toBeInstanceOf(SvgList);
  });

  test('foreignObject wraps HTML content', () => {
    const root = new Svg('svg');
    root.foreignObject('<span class="label">Hi</span>', { x: 1 }, 'ct-fo');
    const fo = root.getNode().querySelector('foreignObject')!;
    expect(fo.getAttribute('class')).toBe('ct-fo');
    expect(fo.querySelector('span.label')!.textContent).toBe('Hi');
  });

  test('animate in guided mode falls back to the end value without SMIL', async () => {
    const line = new Svg('svg').elem('line', { x1: 0 });
    line.animate({
      x1: { begin: 0, dur: 100, from: 0, to: 10, easing: easings.easeOutQuint }
    });
    // jsdom has no beginElement(), so 1.5 jumps to the end value.
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(line.attr('x1')).toBe('10');
    expect(line.getNode().querySelector('animate')).toBeNull();
  });
});

describe('SvgList', () => {
  test('applies Svg methods to every element', () => {
    const root = new Svg('svg');
    root.elem('line');
    root.elem('line');
    const list = root.querySelectorAll('line');
    expect(list.addClass('x').attr({ y1: 2 })).toBe(list);
    expect(
      Array.from(root.getNode().querySelectorAll('line'), el => [
        el.getAttribute('class'),
        el.getAttribute('y1')
      ])
    ).toEqual([
      ['x', '2'],
      ['x', '2']
    ]);
  });

  test('can be created from a node list', () => {
    const root = new Svg('svg');
    root.elem('g');
    new SvgList(root.getNode().querySelectorAll('g')).addClass('wrapped');
    expect(root.querySelector('g.wrapped')).not.toBeNull();
  });
});

describe('SvgPath', () => {
  test('builds and stringifies move, line, curve and arc commands', () => {
    const path = new SvgPath()
      .move(0, 0)
      .line(10, 10)
      .curve(1, 2, 3, 4, 5, 6)
      .arc(5, 5, 0, 0, 1, 20, 20);
    expect(path.stringify()).toBe('M0,0L10,10C1,2,3,4,5,6A5,5,0,0,1,20,20');
    expect(new SvgPath(true).move(1, 1).line(2, 2).stringify()).toBe(
      'M1,1L2,2Z'
    );
  });

  test('parses path strings', () => {
    expect(new SvgPath().parse('M0,0L10,10C1,2,3,4,5,6').stringify()).toBe(
      'M0,0L10,10C1,2,3,4,5,6'
    );
  });

  test('scale and translate', () => {
    const path = () =>
      new SvgPath().move(1, 2).line(3, 4).curve(1, 1, 2, 2, 3, 3);
    expect(path().scale(2, 3).stringify()).toBe('M2,6L6,12C2,3,4,6,6,9');
    expect(path().translate(1, -1).stringify()).toBe('M2,1L4,3C2,0,3,1,4,2');
  });

  test('transform maps every parameter', () => {
    const path = new SvgPath()
      .move(1, 2)
      .line(3, 4)
      .transform((command, param, commandIndex) =>
        param === 'y' && commandIndex === 1 ? 0 : undefined
      );
    expect(path.stringify()).toBe('M1,2L3,0');
  });

  test('clone, splitByCommand, join and accuracy', () => {
    const path = new SvgPath().parse('M0,0L1,1M5,5L6,6');
    expect(path.clone(true).stringify()).toBe('M0,0L1,1M5,5L6,6Z');
    expect(path.splitByCommand('M').map(part => part.stringify())).toEqual([
      'M0,0L1,1',
      'M5,5L6,6'
    ]);
    expect(
      SvgPath.join([
        new SvgPath().move(0, 0),
        new SvgPath().line(1, 1)
      ]).stringify()
    ).toBe('M0,0L1,1');
    expect(
      new SvgPath(false, { accuracy: 1 }).move(1.234, 5.678).stringify()
    ).toBe('M1.2,5.7');
  });
});
