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
    var svg = new window.Chartist.Svg('svg');

    expect(svg).toBeDefined();
    expect(svg._node).toBeDefined();
    expect(svg._node.nodeName.toLowerCase()).toBe('svg');
  });

  it('should create a valid svg dom element with attributes', function () {
    var svg = new window.Chartist.Svg('svg', {
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
    var svg = new window.Chartist.Svg('svg');
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
    var svg = new window.Chartist.Svg('svg');
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

  it('should allow to set namespaced attributes', function () {
    var svg = new window.Chartist.Svg('image');
    svg.elem('image').attr({
      x: 100,
      y: 100,
      height: 100,
      width: 100,
      'xlink:href': 'image.jpg'
    });

    expect(svg._node).toBeDefined();
    expect(svg._node.firstChild).toBeDefined();
    expect(svg._node.firstChild.getAttribute('x')).toBe('100');
    expect(svg._node.firstChild.getAttribute('y')).toBe('100');
    expect(svg._node.firstChild.getAttribute('width')).toBe('100');
    expect(svg._node.firstChild.getAttribute('height')).toBe('100');
    expect(svg._node.firstChild.getAttributeNS(Chartist.namespaces.xlink, 'href')).toBe('image.jpg');
  });

  it('should clear on each nesting level', function () {
    var svg = new window.Chartist.Svg('svg');
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

  it('should allow to remove a certain element', function () {
    var svg = new window.Chartist.Svg('svg');
    var text = svg.elem('text');

    expect(svg._node).toBeDefined();
    expect(svg._node.childNodes.length).toBe(1);
    expect(svg._node.firstChild.nodeName.toLowerCase()).toBe('text');

    text.remove();
    expect(svg._node.childNodes.length).toBe(0);
  });

  it('should allow to write text content into elements', function () {
    var svg = new window.Chartist.Svg('svg');
    svg.elem('text').text('Hello World');

    expect(svg._node).toBeDefined();
    expect(svg._node.childNodes.length).toBe(1);
    expect(svg._node.firstChild.nodeName.toLowerCase()).toBe('text');
    expect(svg._node.firstChild.firstChild.nodeType).toBe(3);
    expect(svg._node.firstChild.firstChild.textContent).toBe('Hello World');
  });

  it('should allow to add and remove classes on elements', function () {
    var svg = new window.Chartist.Svg('svg')
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

    expect(svg._node.getAttribute('class')).toBe('test-class-4');
  });

  it('should allow to travers up in the fluent API chain and set attributes on the way', function () {
    var svg = new window.Chartist.Svg('svg');
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

  describe('path tests', function () {
    it('should handle position updates correctly', function () {
      var path = new Chartist.Svg.Path();
      expect(path.position()).toBe(0);
      expect(path.position(100).position()).toBe(0);
      expect(path.position(-1).position()).toBe(0);

      path.pathElements = [1, 2, 3];
      expect(path.position(100).position()).toBe(3);
    });

    it('should add absolute and relative path elements correctly', function () {
      var path = new Chartist.Svg.Path()
        .move(1, 2)
        .move(3, 4, true)
        .line(5, 6)
        .line(7, 8, true)
        .curve(9, 10, 11, 12, 13, 14)
        .curve(15, 16, 17, 18, 19, 20, true);

      expect(path.pathElements.length).toBe(6);
      expect(path.pathElements).toEqual([
        { command: 'M', x: 1, y: 2 },
        { command: 'm', x: 3, y: 4 },
        { command: 'L', x: 5, y: 6 },
        { command: 'l', x: 7, y: 8 },
        { command: 'C', x1: 9, y1: 10, x2: 11, y2: 12, x: 13, y: 14 },
        { command: 'c', x1: 15, y1: 16, x2: 17, y2: 18, x: 19, y: 20 }
      ]);
    });

    it('should insert new elements at correct position', function () {
      var path = new Chartist.Svg.Path()
        .move(1, 2)
        .move(7, 8)
        .move(9, 10)
        .position(1)
        .move(3, 4)
        .move(5, 6)
        .position(100000)
        .move(11, 12)
        .position(-100000)
        .move(-1, 0);

      expect(path.pathElements.length).toBe(7);
      expect(path.pathElements).toEqual([
        { command: 'M', x: -1, y: 0 },
        { command: 'M', x: 1, y: 2 },
        { command: 'M', x: 3, y: 4 },
        { command: 'M', x: 5, y: 6 },
        { command: 'M', x: 7, y: 8 },
        { command: 'M', x: 9, y: 10 },
        { command: 'M', x: 11, y: 12 }
      ]);
    });

    it('should stringify simple shape correctly', function () {
      var path = new Chartist.Svg.Path(true).move(10, 10).line(10, 100).line(100, 100).line(100, 10);
      expect(path.stringify()).toEqual('M10,10L10,100L100,100L100,10Z');
    });

    it('should stringify with configured precision', function () {
      var path = new Chartist.Svg.Path(false, {
        accuracy: 2
      }).move(10.12345, 10.14345).line(10.14545, 10).line(10.14000000645, 10.3333333333);
      expect(path.stringify()).toEqual('M10.12,10.14L10.15,10L10.14,10.33');
    });

    it('should parse Chartist SVG path style correctly', function () {
      var path = new Chartist.Svg.Path().parse('M10,10L10,100L100,100L100,10');
      expect(path.stringify()).toEqual('M10,10L10,100L100,100L100,10');
    });

    it('should parse MDN SVG path style correctly', function () {
      var path = new Chartist.Svg.Path().parse('M10 10 L 10 100 L 100 100 L 100 10 C 1 1, 1 1, 1 1');
      expect(path.stringify()).toEqual('M10,10L10,100L100,100L100,10C1,1,1,1,1,1');
    });

    it('should parse path with closing command', function () {
      var path = new Chartist.Svg.Path().parse('M10 10 L 10 100 L 100 100 L 100 10 C 1 1, 1 1, 1 1 Z');
      expect(path.stringify()).toEqual('M10,10L10,100L100,100L100,10C1,1,1,1,1,1');
    });

    it('should parse complex path correctly', function () {
      var path = new Chartist.Svg.Path(false, {
        accuracy: false
      }).parse('M7.566371681415929,313.5870318472049L15.132743362831858,322.1479887268699L22.699115044247787,292.49058976570063L30.265486725663717,284.9469379116152L37.83185840707964,277.62070141556273L45.39823008849557,285.4043086222666L52.9646017699115,295.16905806058617L60.530973451327434,288.5395967440654L68.09734513274336,282.3023155078293L75.66371681415929,276.9420221519757L83.23008849557522,271.31296300227655L90.79646017699115,273.1827546735411L98.36283185840708,282.72148250847295L105.929203539823,276.55760703185683L113.49557522123892,278.16318930715545L121.06194690265487,279.67913384762466L128.6283185840708,296.53529757775897L136.1946902654867,324.4003397770142L143.76106194690263,317.1376004332516L151.32743362831857,323.3390406432677L158.89380530973452,328.5597479599146L166.46017699115043,329.67851354926904L174.02654867256635,327.71837583373326L181.5929203539823,335.05972598190976L189.15929203539824,334.29372633331286L196.72566371681415,332.68724934321176L204.29203539823007,330.6752327006325L211.858407079646,325.971917329413L219.42477876106196,328.13057177790404L226.99115044247785,309.6546479835954L234.5575221238938,310.6637826993739L242.12389380530973,310.65221523366176L249.69026548672568,318.40285733188773L257.2566371681416,298.18154267575227L264.8230088495575,307.4788389000347L272.3893805309734,304.189264255087L279.95575221238937,289.0288876874009L287.52212389380526,300.20654714775424L295.0884955752212,298.0164127652739L302.65486725663715,287.69192345832175L310.2212389380531,293.1860711045035L317.78761061946904,300.4760502113585L325.3539823008849,297.94852206276937L332.92035398230087,305.6594311405378L340.4867256637168,306.7859423144216L348.0530973451327,275.68998851331963L355.61946902654864,286.5550640745874L363.1858407079646,288.4952543187362L370.75221238938053,290.1896066608983L378.3185840707965,277.8447927515142L385.88495575221236,282.46018876596827L393.4513274336283,261.617847596371L401.01769911504425,265.06101027918726L408.58407079646014,264.60492966286677L416.1504424778761,252.35288845280365L423.716814159292,239.29220756750195L431.283185840708,229.73170018586225L438.8495575221239,224.1580859168795L446.41592920353986,217.20551113129414L453.9823008849557,212.63435660265037L461.54867256637164,210.4425212857057L469.1150442477876,201.0077146146342L476.6814159292035,182.3934004122068L484.24778761061947,176.98732946386616L491.8141592920354,175.3660655079267L499.38053097345136,181.1589144624976L506.9469026548673,172.81581557677976L514.5132743362832,177.82343674256106L522.079646017699,183.5573714672562L529.646017699115,184.4980688436067L537.2123893805309,201.60789339862924L544.7787610619469,193.42268767053048L552.3451327433628,209.9219909677575L559.9115044247787,221.1318944868172L567.4778761061947,222.47350026973174L575.0442477876105,229.94061399967882L582.6106194690265,213.57676800697396L590.1769911504424,232.97280246785252L597.7433628318583,232.8915724787845L605.3097345132743,231.486089735319L612.8761061946902,234.26534000120475L620.4424778761062,219.90951817170736L628.0088495575221,214.36149678900725L635.5752212389381,204.7245641444236L643.1415929203539,205.04759319834227L650.7079646017698,178.61624621480792L658.2743362831858,174.30656351022486L665.8407079646017,194.06864637030463L673.4070796460177,191.38404795482728L680.9734513274336,188.88380371217903L688.5398230088496,182.47430260433697L696.1061946902654,192.70175438596493L703.6725663716813,182.37945067166908L711.2389380530973,163.80499447227572L718.8053097345132,157.4839718811134L726.3716814159292,149.57403342725343L733.9380530973451,142.6076734278762L741.5044247787611,144.9954413314636L749.070796460177,152.29112878815386L756.637168141593,150.02544379977235L764.2035398230088,139.40203164917125L771.7699115044247,149.22935357717972L779.3362831858407,155.78116263659354L786.9026548672566,145.09966219897575L794.4690265486726,157.52407467202426L802.0353982300885,147.01645902195105L809.6017699115044,141.8658056183404L817.1681415929203,134.36135158737966L824.7345132743362,127.49269525433283L832.3008849557522,120.25886939571154L839.8672566371681,118.26230310074709L847.433628318584,98.76959064327474');
      expect(path.stringify()).toEqual('M7.566371681415929,313.5870318472049L15.132743362831858,322.1479887268699L22.699115044247787,292.49058976570063L30.265486725663717,284.9469379116152L37.83185840707964,277.62070141556273L45.39823008849557,285.4043086222666L52.9646017699115,295.16905806058617L60.530973451327434,288.5395967440654L68.09734513274336,282.3023155078293L75.66371681415929,276.9420221519757L83.23008849557522,271.31296300227655L90.79646017699115,273.1827546735411L98.36283185840708,282.72148250847295L105.929203539823,276.55760703185683L113.49557522123892,278.16318930715545L121.06194690265487,279.67913384762466L128.6283185840708,296.53529757775897L136.1946902654867,324.4003397770142L143.76106194690263,317.1376004332516L151.32743362831857,323.3390406432677L158.89380530973452,328.5597479599146L166.46017699115043,329.67851354926904L174.02654867256635,327.71837583373326L181.5929203539823,335.05972598190976L189.15929203539824,334.29372633331286L196.72566371681415,332.68724934321176L204.29203539823007,330.6752327006325L211.858407079646,325.971917329413L219.42477876106196,328.13057177790404L226.99115044247785,309.6546479835954L234.5575221238938,310.6637826993739L242.12389380530973,310.65221523366176L249.69026548672568,318.40285733188773L257.2566371681416,298.18154267575227L264.8230088495575,307.4788389000347L272.3893805309734,304.189264255087L279.95575221238937,289.0288876874009L287.52212389380526,300.20654714775424L295.0884955752212,298.0164127652739L302.65486725663715,287.69192345832175L310.2212389380531,293.1860711045035L317.78761061946904,300.4760502113585L325.3539823008849,297.94852206276937L332.92035398230087,305.6594311405378L340.4867256637168,306.7859423144216L348.0530973451327,275.68998851331963L355.61946902654864,286.5550640745874L363.1858407079646,288.4952543187362L370.75221238938053,290.1896066608983L378.3185840707965,277.8447927515142L385.88495575221236,282.46018876596827L393.4513274336283,261.617847596371L401.01769911504425,265.06101027918726L408.58407079646014,264.60492966286677L416.1504424778761,252.35288845280365L423.716814159292,239.29220756750195L431.283185840708,229.73170018586225L438.8495575221239,224.1580859168795L446.41592920353986,217.20551113129414L453.9823008849557,212.63435660265037L461.54867256637164,210.4425212857057L469.1150442477876,201.0077146146342L476.6814159292035,182.3934004122068L484.24778761061947,176.98732946386616L491.8141592920354,175.3660655079267L499.38053097345136,181.1589144624976L506.9469026548673,172.81581557677976L514.5132743362832,177.82343674256106L522.079646017699,183.5573714672562L529.646017699115,184.4980688436067L537.2123893805309,201.60789339862924L544.7787610619469,193.42268767053048L552.3451327433628,209.9219909677575L559.9115044247787,221.1318944868172L567.4778761061947,222.47350026973174L575.0442477876105,229.94061399967882L582.6106194690265,213.57676800697396L590.1769911504424,232.97280246785252L597.7433628318583,232.8915724787845L605.3097345132743,231.486089735319L612.8761061946902,234.26534000120475L620.4424778761062,219.90951817170736L628.0088495575221,214.36149678900725L635.5752212389381,204.7245641444236L643.1415929203539,205.04759319834227L650.7079646017698,178.61624621480792L658.2743362831858,174.30656351022486L665.8407079646017,194.06864637030463L673.4070796460177,191.38404795482728L680.9734513274336,188.88380371217903L688.5398230088496,182.47430260433697L696.1061946902654,192.70175438596493L703.6725663716813,182.37945067166908L711.2389380530973,163.80499447227572L718.8053097345132,157.4839718811134L726.3716814159292,149.57403342725343L733.9380530973451,142.6076734278762L741.5044247787611,144.9954413314636L749.070796460177,152.29112878815386L756.637168141593,150.02544379977235L764.2035398230088,139.40203164917125L771.7699115044247,149.22935357717972L779.3362831858407,155.78116263659354L786.9026548672566,145.09966219897575L794.4690265486726,157.52407467202426L802.0353982300885,147.01645902195105L809.6017699115044,141.8658056183404L817.1681415929203,134.36135158737966L824.7345132743362,127.49269525433283L832.3008849557522,120.25886939571154L839.8672566371681,118.26230310074709L847.433628318584,98.76959064327474');
    });

    it('should scale path along both axes', function () {
      var path = new Chartist.Svg.Path()
        .move(1, 2)
        .line(3, 4)
        .curve(5, 6, 7, 8, 9, 10)
        .scale(10, 100);

      expect(path.pathElements).toEqual([
        { command: 'M', x: 10, y: 200 },
        { command: 'L', x: 30, y: 400 },
        { command: 'C', x1: 50, y1: 600, x2: 70, y2: 800, x: 90, y: 1000 }
      ]);
    });

    it('should translate path along both axes', function () {
      var path = new Chartist.Svg.Path()
        .move(1, 2)
        .line(3, 4)
        .curve(5, 6, 7, 8, 9, 10)
        .translate(10, 100);

      expect(path.pathElements).toEqual([
        { command: 'M', x: 11, y: 102 },
        { command: 'L', x: 13, y: 104 },
        { command: 'C', x1: 15, y1: 106, x2: 17, y2: 108, x: 19, y: 110 }
      ]);
    });

    it('should transform path correctly with custom function', function () {
      var path = new Chartist.Svg.Path()
        .move(1, 2)
        .line(3, 4)
        .curve(5, 6, 7, 8, 9, 10)
        .transform(function(element, paramName, elementIndex, paramIndex) {
          if(paramIndex > 3) {
            return 0;
          } else if(paramName[0] === 'y') {
            return 100;
          }
        });

      expect(path.pathElements).toEqual([
        { command: 'M', x: 1, y: 100 },
        { command: 'L', x: 3, y: 100 },
        { command: 'C', x1: 5, y1: 100, x2: 7, y2: 100, x: 0, y: 0 }
      ]);
    });

    it('should split correctly by move command', function () {
      var paths = new Chartist.Svg.Path().parse('M0,0L0,0L0,0L0,0M0,0L0,0L0,0L0,0').splitByCommand('M');
      expect(paths).toHaveLength(2);
      expect(paths[0].pathElements[0].command).toBe('M');
      expect(paths[0].pathElements).toHaveLength(4);
      expect(paths[1].pathElements[0].command).toBe('M');
      expect(paths[1].pathElements).toHaveLength(4);
    });

    it('should split correctly by move command and tailing move element', function () {
      var paths = new Chartist.Svg.Path().parse('M0,0L0,0L0,0L0,0M0,0L0,0L0,0L0,0M0,0').splitByCommand('M');
      expect(paths).toHaveLength(3);
      expect(paths[2].pathElements[0].command).toBe('M');
    });

    it('should split correctly by move command and leading other commands', function () {
      var paths = new Chartist.Svg.Path().parse('L0,0C0,0,0,0,0,0M0,0L0,0L0,0L0,0M0,0L0,0L0,0L0,0').splitByCommand('M');
      expect(paths).toHaveLength(3);
      expect(paths[0].pathElements).toHaveLength(2);
      expect(paths[0].pathElements[0].command).toBe('L');
      expect(paths[0].pathElements[1].command).toBe('C');

      expect(paths[1].pathElements).toHaveLength(4);
      expect(paths[1].pathElements[0].command).toBe('M');
    });
  });
});
