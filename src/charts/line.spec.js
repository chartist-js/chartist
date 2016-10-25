import {AutoScaleAxis, FixedScaleAxis} from '../axes/axes';
import {LineChart} from './line';
import * as Interpolation from '../interpolation/interpolation';
import {namespaces} from '../core/globals';
import {deserialize} from '../core/data';
import {addFixture, destroyFixtures, initializeFixtures} from '../testing/fixtures';

describe('LineChart', () => {
  let fixture;
  let options;
  let data;

  function createChart(callback) {
    fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
    const chart = new LineChart(fixture.wrapper.querySelector('.ct-chart'), data, options)
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
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]]
      };
      options =  {
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
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('.ct-grids').length).toBe(1);
        done();
      });
    });

    it('should draw grid lines', (done) => {
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('.ct-grids .ct-grid.ct-horizontal').length).toBe(3);
        expect(fixture.wrapper.querySelectorAll('.ct-grids .ct-grid.ct-vertical').length).toBe(5);
        done();
      });
    });

    it('should draw grid background', (done) => {
      options.showGridBackground = true;
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('.ct-grids .ct-grid-background').length).toBe(1);
        done();
      });
    });

    it('should not draw grid background if option set to false', (done) => {
      options.showGridBackground = false;
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('.ct-grids .ct-grid-background').length).toBe(0);
        done();
      });
    });
  });

  describe('AxisY position tests', () => {
    beforeEach(() => {
      data = {
        series: [[
          { x: 1, y: 1 },
          { x: 3, y: 5 }
        ]]
      };
      options =  {};
    });

    it('should have ct-start class if position start', (done) => {
      options = {
        axisY: {
          position: 'start'
        }
      };

      createChart(() => {
        Array.from(fixture.wrapper.querySelectorAll('.ct-label.ct-vertical'))
          .forEach((element) => expect(element.getAttribute('class')).toBe('ct-label ct-vertical ct-start'));
        done();
      });
    });

    it('should have ct-end class if position is any other value than start', (done) => {
      options = {
        axisY: {
          position: 'right'
        }
      };

      createChart(() => {
        Array.from(fixture.wrapper.querySelectorAll('.ct-label.ct-vertical'))
          .forEach((element) => expect(element.getAttribute('class')).toBe('ct-label ct-vertical ct-end'));
        done();
      });
    });
  });

  describe('ct:value attribute', () => {
    it('should contain x and y value for each datapoint', (done) => {
      data = {
        series: [[
          {x: 1, y: 2},
          {x: 3, y: 4}
        ]]
      };
      options = {
        axisX: {
          type: FixedScaleAxis
        }
      };

      createChart(() => {
        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(points[0].getAttributeNS(namespaces.ct, 'value')).toBe('1,2');
        expect(points[1].getAttributeNS(namespaces.ct, 'value')).toBe('3,4');
        done();
      });
    });

    it('should render values that are zero', (done) => {
      data = {
        series: [[
          {x: 0, y: 1},
          {x: 1, y: 0},
          {x: 0, y: 0}
        ]]
      };
      options = {
        axisX: {
          type: FixedScaleAxis
        }
      };

      createChart(() => {
        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(points[0].getAttributeNS(namespaces.ct, 'value')).toBe('0,1');
        expect(points[1].getAttributeNS(namespaces.ct, 'value')).toBe('1,0');
        expect(points[2].getAttributeNS(namespaces.ct, 'value')).toBe('0,0');
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
        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(deserialize(points[3].getAttributeNS(namespaces.ct, 'meta'))).toEqual(meta);
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
        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(deserialize(points[3].getAttributeNS(namespaces.ct, 'meta'))).toEqual(meta);
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
            fixture.wrapper.querySelectorAll('.ct-series-a .ct-point')[3]
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
            fixture.wrapper.querySelectorAll('.ct-series-b .ct-point')[2]
              .getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(valueMeta);

        done();
      });
    });
  });

  describe('Line charts with holes', () => {
    it('should render correctly with Interpolation.none and holes everywhere', (done) => {
      data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      };
      options = {
        lineSmooth: false
      };

      const chart = createChart();
      chart.on('draw', (context) => {
        if (context.type === 'line') {
          expect(context.path.pathElements.map((pathElement) => {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with Interpolation.cardinal and holes everywhere', (done) => {
      data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      };
      options = {
        lineSmooth: true
      };

      const chart = createChart();
      chart.on('draw', (context) => {
        if (context.type === 'line') {
          expect(context.path.pathElements.map((pathElement) => {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            // Cardinal should create Line path segment if only one connection
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            // Cardinal should create Curve path segment for 2 or more connections
            {command: 'C', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'C', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with Interpolation.monotoneCubic and holes everywhere', (done) => {
      data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      };
      options = {
        lineSmooth: Interpolation.monotoneCubic()
      };

      const chart = createChart();
      chart.on('draw', (context) => {
        if (context.type === 'line') {
          expect(context.path.pathElements.map((pathElement) => {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            // Monotone cubic should create Line path segment if only one connection
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            // Monotone cubic should create Curve path segment for 2 or more connections
            {command: 'C', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'C', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with Interpolation.simple and holes everywhere', (done) => {
      data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      };
      options = {
        lineSmooth: Interpolation.simple()
      };

      const chart = createChart();
      chart.on('draw', (context) => {
        if (context.type === 'line') {
          expect(context.path.pathElements.map((pathElement) => {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'C', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'C', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'C', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with postponed Interpolation.step and holes everywhere', (done) => {
      data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      };
      options = {
        lineSmooth: Interpolation.step()
      };

      const chart = createChart();
      chart.on('draw', (context) => {
        if (context.type === 'line') {
          expect(context.path.pathElements.map((pathElement) => {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });

    it('should render correctly with preponed Interpolation.step and holes everywhere', (done) => {
      data = {
        labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
        series: [
          [NaN, 15, 0, null, 2, 3, 4, undefined, {value: 1, meta: 'meta data'}, null]
        ]
      };
      options ={
        lineSmooth: Interpolation.step({
          postpone: false
        })
      };

      const chart = createChart();
      chart.on('draw', (context) => {
        if (context.type === 'line') {
          expect(context.path.pathElements.map((pathElement) => {
            return {
              command: pathElement.command,
              data: pathElement.data
            };
          })).toEqual([
            {command: 'M', data: {valueIndex: 1, value: {x: undefined, y: 15}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'L', data: {valueIndex: 2, value: {x: undefined, y: 0}, meta: undefined}},
            {command: 'M', data: {valueIndex: 4, value: {x: undefined, y: 2}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 5, value: {x: undefined, y: 3}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'L', data: {valueIndex: 6, value: {x: undefined, y: 4}, meta: undefined}},
            {command: 'M', data: {valueIndex: 8, value: {x: undefined, y: 1}, meta: 'meta data'}}
          ]);
          done();
        }
      });
    });
  });

  describe('Single value data tests', () => {
    beforeEach(() => {
      data = {
        labels: [1],
        series: [[1]]
      };
    });

    it('should render without NaN values and points', (done) => {
      createChart(() => {
        expect(document.querySelector('.ct-line').getAttribute('d')).toBe('M50,15');
        expect(document.querySelector('.ct-point').getAttribute('x1')).toBe('50');
        expect(document.querySelector('.ct-point').getAttribute('x2')).toBe('50.01');
        done();
      });
    });
  });

  describe('Empty data tests', () => {
    it('should render empty grid with no data', (done) => {
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
        series:  [
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
      data = null;
      options ={
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
      data = null;
      options = {
        reverseData: true
      };

      createChart(() => {
        // Find at least one vertical grid line
        expect(document.querySelector('.ct-grids .ct-grid.ct-vertical')).toBeDefined();
        done();
      });
    });
  });

  describe('x1 and x2 attribute', () => {
    it('should contain just a datapoint', (done) => {
      data = {
        series: [[
          {x: 1, y: 2}
        ]]
      };
      options = {
        fullWidth: true
      };

      createChart(() => {
        expect(document.querySelector('.ct-point').getAttribute('x1')).not.toBe('NaN');
        expect(document.querySelector('.ct-point').getAttribute('x2')).not.toBe('NaN');
        done();
      });
    });
  });
});
