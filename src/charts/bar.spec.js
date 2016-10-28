import {AutoScaleAxis} from '../axes/axes';
import {BarChart} from './bar';
import {namespaces} from '../core/globals';
import {deserialize} from '../core/data';
import {addFixture, destroyFixtures, initializeFixtures} from '../testing/fixtures';

describe('BarChart', () => {
  let fixture;
  let options;
  let data;

  function createChart(callback) {
    fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
    const chart = new BarChart(fixture.wrapper.querySelector('.ct-chart'), data, options)
      .on('created', () => {
        callback && callback();
        chart.off('created');
      });
    return chart;
  }

  beforeEach(() => initializeFixtures());
  afterEach(() => {
    destroyFixtures();
    data = undefined;
    options = undefined;
  });

  describe('grids', () => {
    beforeEach(() => {
      data = {
        series: [[
          {x: 1, y: 1},
          {x: 3, y: 5}
        ]]
      };
      options = {
        axisX: {
          type: AutoScaleAxis,
          onlyInteger: true
        },
        axisY: {
          type: AutoScaleAxis,
          onlyInteger: true
        }
      };
    });

    it('should contain ct-grids group', (done) => {
      data = null;
      options = null;
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('g.ct-grids').length).toBe(1);
        done();
      });
    });

    it('should draw grid lines', (done) => {
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('g.ct-grids line.ct-grid.ct-horizontal').length).toBe(3);
        expect(fixture.wrapper.querySelectorAll('g.ct-grids line.ct-grid.ct-vertical').length).toBe(6);
        done();
      });
    });

    it('should draw grid background', (done) => {
      options.showGridBackground = true;
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('g.ct-grids rect.ct-grid-background').length).toBe(1);
        done();
      });
    });

    it('should not draw grid background if option set to false', (done) => {
      options.showGridBackground = false;
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('g.ct-grids rect.ct-grid-background').length).toBe(0);
        done();
      });
    });

  });

  describe('ct:value attribute', () => {
    it('should contain x and y value for each bar', (done) => {
      data = {
        series: [[
          {x: 1, y: 2},
          {x: 3, y: 4}
        ]]
      };
      options = {
        axisX: {
          type: AutoScaleAxis
        }
      };

      createChart(() => {
        const bars = fixture.wrapper.querySelectorAll('.ct-bar');
        expect(bars[0].getAttributeNS(namespaces.ct, 'value')).toEqual('1,2');
        expect(bars[1].getAttributeNS(namespaces.ct, 'value')).toEqual('3,4');
        done();
      });
    });

    it('should render values that are zero', (done) => {
      data = {
        series: [[
          {x: 0, y: 1},
          {x: 2, y: 0},
          {x: 0, y: 0}
        ]]
      };
      options = {
        axisX: {
          type: AutoScaleAxis
        }
      };

      createChart(() => {
        const bars = fixture.wrapper.querySelectorAll('.ct-bar');
        expect(bars[0].getAttributeNS(namespaces.ct, 'value')).toEqual('0,1');
        expect(bars[1].getAttributeNS(namespaces.ct, 'value')).toEqual('2,0');
        expect(bars[2].getAttributeNS(namespaces.ct, 'value')).toEqual('0,0');
        done();
      });
    });
  });

  describe('Meta data tests', () => {
    it('should render meta data correctly with mixed value array', (done) => {
      const meta = {
        test: 'Serialized Test'
      };

      data = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
        series: [
          [5, 2, 4, {
            value: 2,
            meta: meta
          }, 0]
        ]
      };

      createChart(() => {
        const bar = fixture.wrapper.querySelectorAll('.ct-bar')[3];
        expect(deserialize(bar.getAttributeNS(namespaces.ct, 'meta'))).toEqual(meta);
        done();
      });
    });

    it('should render meta data correctly with mixed value array and different normalized data length', (done) => {
      const meta = {
        test: 'Serialized Test'
      };

      data = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        series: [
          [5, 2, 4, {
            value: 2,
            meta: meta
          }, 0]
        ]
      };

      createChart(() => {
        const bar = fixture.wrapper.querySelectorAll('.ct-bar')[3];
        expect(deserialize(bar.getAttributeNS(namespaces.ct, 'meta'))).toEqual(meta);
        done();
      });
    });

    it('should render meta data correctly with mixed value array and mixed series notation', (done) => {
      const seriesMeta = 9999;
      const valueMeta = {
        test: 'Serialized Test'
      };

      data = {
        labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        series: [
          [5, 2, 4, {
            value: 2,
            meta: valueMeta
          }, 0],
          {
            meta: seriesMeta,
            data: [5, 2, {
              value: 2,
              meta: valueMeta
            }, 0]
          }
        ]
      };

      createChart(() => {
        expect(
          deserialize(
            fixture.wrapper.querySelectorAll('.ct-series-a .ct-bar')[3]
              .getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(valueMeta);

        expect(
          deserialize(
            fixture.wrapper.querySelector('.ct-series-b')
              .getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(seriesMeta);

        expect(
          deserialize(
            fixture.wrapper.querySelectorAll('.ct-series-b .ct-bar')[2]
              .getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(valueMeta);

        done();
      });
    });
  });

  describe('Empty data tests', () => {
    it('should render empty grid with no data', (done) => {
      data = null;
      options = null;

      createChart(() => {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with only labels', (done) => {
      data = {
        labels: [1, 2, 3, 4]
      };

      createChart(() => {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        // Find exactly as many horizontal grid lines as labels were specified (Step Axis)
        expect(document.querySelectorAll('.ct-grids .ct-grid.ct-horizontal').length).toBe(data.labels.length);
        done();
      });
    });

    it('should generate labels and render empty grid with only series in data', (done) => {
      data = {
        series: [
          [1, 2, 3, 4],
          [2, 3, 4],
          [3, 4]
        ]
      };

      createChart(() => {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        // Should generate the labels using the largest series count
        expect(document.querySelectorAll('.ct-grids .ct-grid.ct-horizontal').length)
          .toBe(Math.max(...data.series.map((series) => series.length)));
        done();
      });
    });

    it('should render empty grid with no data and specified high low', (done) => {
      options = {
        width: 400,
        height: 300,
        high: 100,
        low: -100
      };

      createChart(() => {
        // Find first and last label
        const labels = document.querySelectorAll('.ct-labels .ct-label.ct-vertical');
        const firstLabel = labels[0];
        const lastLabel = labels[labels.length - 1];

        expect(firstLabel.textContent.trim()).toBe('-100');
        expect(lastLabel.textContent.trim()).toBe('100');
        done();
      });
    });

    it('should render empty grid with no data and reverseData option', (done) => {
      options = {
        reverseData: true
      };

      createChart(() => {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with no data and stackBars option', (done) => {
      options = {
        stackBars: true
      };

      createChart(() => {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with no data and horizontalBars option', (done) => {
      options = {
        horizontalBars: true
      };

      createChart(() => {
        // Find at least one vertical grid line
        // TODO: In theory the axis should be created with ct-horizontal class
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });

    it('should render empty grid with no data and distributeSeries option', (done) => {
      options = {
        distributeSeries: true
      };

      createChart(() => {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });
  });
});
