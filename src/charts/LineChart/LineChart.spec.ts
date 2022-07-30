import { AutoScaleAxis, FixedScaleAxis } from '../../axes';
import { LineChartOptions, LineChartData, LineChart } from '.';
import * as Interpolation from '../../interpolation';
import { namespaces, deserialize } from '../../core';
import {
  Fixture,
  addMockWrapper,
  destroyMockDom,
  mockDom,
  mockDomRects,
  destroyMockDomRects
} from '../../../test/mock/dom';

describe('Charts', () => {
  describe('LineChart', () => {
    let fixture: Fixture;
    let chart: LineChart;
    let options: LineChartOptions;
    let data: LineChartData;

    function createChart() {
      return new Promise<void>(resolve => {
        fixture = addMockWrapper(
          '<div class="ct-chart ct-golden-section"></div>'
        );
        const { wrapper } = fixture;
        chart = new LineChart(
          wrapper.querySelector('.ct-chart'),
          data,
          options
        ).on('created', () => {
          resolve();
          chart.off('created');
        });
      });
    }

    beforeEach(() => {
      mockDom();
      mockDomRects();
    });
    afterEach(() => {
      destroyMockDom();
      destroyMockDomRects();
      data = { series: [] };
      options = {};
    });

    describe('grids', () => {
      beforeEach(() => {
        data = {
          series: [
            [
              { x: 1, y: 1 },
              { x: 3, y: 5 }
            ]
          ]
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

      it('should contain ct-grids group', async () => {
        await createChart();

        expect(fixture.wrapper.querySelectorAll('.ct-grids').length).toBe(1);
      });

      it('should draw grid lines', async () => {
        await createChart();

        expect(
          fixture.wrapper.querySelectorAll('.ct-grids .ct-grid.ct-horizontal')
            .length
        ).toBe(3);
        expect(
          fixture.wrapper.querySelectorAll('.ct-grids .ct-grid.ct-vertical')
            .length
        ).toBe(5);
      });

      it('should draw grid background', async () => {
        options.showGridBackground = true;
        await createChart();

        expect(
          fixture.wrapper.querySelectorAll('.ct-grids .ct-grid-background')
            .length
        ).toBe(1);
      });

      it('should not draw grid background if option set to false', async () => {
        options.showGridBackground = false;
        await createChart();

        expect(
          fixture.wrapper.querySelectorAll('.ct-grids .ct-grid-background')
            .length
        ).toBe(0);
      });
    });

    describe('AxisY position tests', () => {
      beforeEach(() => {
        data = {
          series: [
            [
              { x: 1, y: 1 },
              { x: 3, y: 5 }
            ]
          ]
        };
        options = {};
      });

      it('should have ct-start class if position start', async () => {
        options = {
          axisY: {
            position: 'start'
          }
        };
        await createChart();

        Array.from(
          fixture.wrapper.querySelectorAll('.ct-label.ct-vertical')
        ).forEach(element =>
          expect(element).toHaveAttribute(
            'class',
            'ct-label ct-vertical ct-start'
          )
        );
      });

      it('should have ct-end class if position is any other value than start', async () => {
        options = {
          axisY: {
            position: 'end' as const
          }
        };
        await createChart();

        Array.from(
          fixture.wrapper.querySelectorAll('.ct-label.ct-vertical')
        ).forEach(element =>
          expect(element).toHaveAttribute(
            'class',
            'ct-label ct-vertical ct-end'
          )
        );
      });
    });

    describe('ct:value attribute', () => {
      it('should contain x and y value for each datapoint', async () => {
        data = {
          series: [
            [
              { x: 1, y: 2 },
              { x: 3, y: 4 }
            ]
          ]
        };
        options = {
          axisX: {
            type: FixedScaleAxis
          }
        };
        await createChart();

        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(points[0].getAttributeNS(namespaces.ct, 'value')).toBe('1,2');
        expect(points[1].getAttributeNS(namespaces.ct, 'value')).toBe('3,4');
      });

      it('should render values that are zero', async () => {
        data = {
          series: [
            [
              { x: 0, y: 1 },
              { x: 1, y: 0 },
              { x: 0, y: 0 }
            ]
          ]
        };
        options = {
          axisX: {
            type: FixedScaleAxis
          }
        };
        await createChart();

        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(points[0].getAttributeNS(namespaces.ct, 'value')).toBe('0,1');
        expect(points[1].getAttributeNS(namespaces.ct, 'value')).toBe('1,0');
        expect(points[2].getAttributeNS(namespaces.ct, 'value')).toBe('0,0');
      });
    });

    describe('Meta data tests', () => {
      it('should render meta data correctly with mixed value array', async () => {
        const meta = {
          test: 'Serialized Test'
        };

        data = {
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu'],
          series: [
            [
              5,
              2,
              4,
              {
                value: 2,
                meta: meta
              },
              0
            ]
          ]
        };
        await createChart();

        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(
          deserialize(points[3].getAttributeNS(namespaces.ct, 'meta'))
        ).toEqual(meta);
      });

      it('should render meta data correctly with mixed value array and different normalized data length', async () => {
        const meta = {
          test: 'Serialized Test'
        };

        data = {
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          series: [
            [
              5,
              2,
              4,
              {
                value: 2,
                meta: meta
              },
              0
            ]
          ]
        };
        await createChart();

        const points = fixture.wrapper.querySelectorAll('.ct-point');
        expect(
          deserialize(points[3].getAttributeNS(namespaces.ct, 'meta'))
        ).toEqual(meta);
      });

      it('should render meta data correctly with mixed value array and mixed series notation', async () => {
        const seriesMeta = 9999;
        const valueMeta = {
          test: 'Serialized Test'
        };

        data = {
          labels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
          series: [
            [
              5,
              2,
              4,
              {
                value: 2,
                meta: valueMeta
              },
              0
            ],
            {
              meta: seriesMeta,
              data: [
                5,
                2,
                {
                  value: 2,
                  meta: valueMeta
                },
                0
              ]
            }
          ]
        };
        await createChart();

        expect(
          deserialize(
            fixture.wrapper
              .querySelectorAll('.ct-series-a .ct-point')[3]
              .getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(valueMeta);

        expect(
          deserialize(
            fixture.wrapper
              .querySelector('.ct-series-b')
              ?.getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(seriesMeta);

        expect(
          deserialize(
            fixture.wrapper
              .querySelectorAll('.ct-series-b .ct-point')[2]
              .getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(valueMeta);
      });
    });

    describe('Line charts with holes', () => {
      it('should render correctly with Interpolation.none and holes everywhere', async () => {
        data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            [
              NaN,
              15,
              0,
              null,
              2,
              3,
              4,
              undefined,
              { value: 1, meta: 'meta data' },
              null
            ]
          ]
        };
        options = {
          lineSmooth: false
        };

        await createChart();

        chart.on('draw', context => {
          if (context.type === 'line') {
            expect(
              context.path.pathElements.map(pathElement => {
                return {
                  command: pathElement.command,
                  data: pathElement.data
                };
              })
            ).toEqual([
              {
                command: 'M',
                data: {
                  valueIndex: 1,
                  value: { x: undefined, y: 15 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 2,
                  value: { x: undefined, y: 0 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 4,
                  value: { x: undefined, y: 2 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 6,
                  value: { x: undefined, y: 4 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 8,
                  value: { x: undefined, y: 1 },
                  meta: 'meta data'
                }
              }
            ]);
          }
        });
      });

      it('should render correctly with Interpolation.cardinal and holes everywhere', async () => {
        data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            [
              NaN,
              15,
              0,
              null,
              2,
              3,
              4,
              undefined,
              { value: 1, meta: 'meta data' },
              null
            ]
          ]
        };
        options = {
          lineSmooth: true
        };

        await createChart();

        chart.on('draw', context => {
          if (context.type === 'line') {
            expect(
              context.path.pathElements.map(pathElement => {
                return {
                  command: pathElement.command,
                  data: pathElement.data
                };
              })
            ).toEqual([
              {
                command: 'M',
                data: {
                  valueIndex: 1,
                  value: { x: undefined, y: 15 },
                  meta: undefined
                }
              },
              // Cardinal should create Line path segment if only one connection
              {
                command: 'L',
                data: {
                  valueIndex: 2,
                  value: { x: undefined, y: 0 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 4,
                  value: { x: undefined, y: 2 },
                  meta: undefined
                }
              },
              // Cardinal should create Curve path segment for 2 or more connections
              {
                command: 'C',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'C',
                data: {
                  valueIndex: 6,
                  value: { x: undefined, y: 4 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 8,
                  value: { x: undefined, y: 1 },
                  meta: 'meta data'
                }
              }
            ]);
          }
        });
      });

      it('should render correctly with Interpolation.monotoneCubic and holes everywhere', async () => {
        data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            [
              NaN,
              15,
              0,
              null,
              2,
              3,
              4,
              undefined,
              { value: 1, meta: 'meta data' },
              null
            ]
          ]
        };
        options = {
          lineSmooth: Interpolation.monotoneCubic()
        };

        await createChart();

        chart.on('draw', context => {
          if (context.type === 'line') {
            expect(
              context.path.pathElements.map(pathElement => {
                return {
                  command: pathElement.command,
                  data: pathElement.data
                };
              })
            ).toEqual([
              {
                command: 'M',
                data: {
                  valueIndex: 1,
                  value: { x: undefined, y: 15 },
                  meta: undefined
                }
              },
              // Monotone cubic should create Line path segment if only one connection
              {
                command: 'L',
                data: {
                  valueIndex: 2,
                  value: { x: undefined, y: 0 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 4,
                  value: { x: undefined, y: 2 },
                  meta: undefined
                }
              },
              // Monotone cubic should create Curve path segment for 2 or more connections
              {
                command: 'C',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'C',
                data: {
                  valueIndex: 6,
                  value: { x: undefined, y: 4 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 8,
                  value: { x: undefined, y: 1 },
                  meta: 'meta data'
                }
              }
            ]);
          }
        });
      });

      it('should render correctly with Interpolation.simple and holes everywhere', async () => {
        data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            [
              NaN,
              15,
              0,
              null,
              2,
              3,
              4,
              undefined,
              { value: 1, meta: 'meta data' },
              null
            ]
          ]
        };
        options = {
          lineSmooth: Interpolation.simple()
        };

        await createChart();

        chart.on('draw', context => {
          if (context.type === 'line') {
            expect(
              context.path.pathElements.map(pathElement => {
                return {
                  command: pathElement.command,
                  data: pathElement.data
                };
              })
            ).toEqual([
              {
                command: 'M',
                data: {
                  valueIndex: 1,
                  value: { x: undefined, y: 15 },
                  meta: undefined
                }
              },
              {
                command: 'C',
                data: {
                  valueIndex: 2,
                  value: { x: undefined, y: 0 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 4,
                  value: { x: undefined, y: 2 },
                  meta: undefined
                }
              },
              {
                command: 'C',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'C',
                data: {
                  valueIndex: 6,
                  value: { x: undefined, y: 4 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 8,
                  value: { x: undefined, y: 1 },
                  meta: 'meta data'
                }
              }
            ]);
          }
        });
      });

      it('should render correctly with postponed Interpolation.step and holes everywhere', async () => {
        data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            [
              NaN,
              15,
              0,
              null,
              2,
              3,
              4,
              undefined,
              { value: 1, meta: 'meta data' },
              null
            ]
          ]
        };
        options = {
          lineSmooth: Interpolation.step()
        };

        await createChart();

        chart.on('draw', context => {
          if (context.type === 'line') {
            expect(
              context.path.pathElements.map(pathElement => {
                return {
                  command: pathElement.command,
                  data: pathElement.data
                };
              })
            ).toEqual([
              {
                command: 'M',
                data: {
                  valueIndex: 1,
                  value: { x: undefined, y: 15 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 1,
                  value: { x: undefined, y: 15 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 2,
                  value: { x: undefined, y: 0 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 4,
                  value: { x: undefined, y: 2 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 4,
                  value: { x: undefined, y: 2 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 6,
                  value: { x: undefined, y: 4 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 8,
                  value: { x: undefined, y: 1 },
                  meta: 'meta data'
                }
              }
            ]);
          }
        });
      });

      it('should render correctly with preponed Interpolation.step and holes everywhere', async () => {
        data = {
          labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
          series: [
            [
              NaN,
              15,
              0,
              null,
              2,
              3,
              4,
              undefined,
              { value: 1, meta: 'meta data' },
              null
            ]
          ]
        };
        options = {
          lineSmooth: Interpolation.step({
            postpone: false
          })
        };

        await createChart();

        chart.on('draw', context => {
          if (context.type === 'line') {
            expect(
              context.path.pathElements.map(pathElement => {
                return {
                  command: pathElement.command,
                  data: pathElement.data
                };
              })
            ).toEqual([
              {
                command: 'M',
                data: {
                  valueIndex: 1,
                  value: { x: undefined, y: 15 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 2,
                  value: { x: undefined, y: 0 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 2,
                  value: { x: undefined, y: 0 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 4,
                  value: { x: undefined, y: 2 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 5,
                  value: { x: undefined, y: 3 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 6,
                  value: { x: undefined, y: 4 },
                  meta: undefined
                }
              },
              {
                command: 'L',
                data: {
                  valueIndex: 6,
                  value: { x: undefined, y: 4 },
                  meta: undefined
                }
              },
              {
                command: 'M',
                data: {
                  valueIndex: 8,
                  value: { x: undefined, y: 1 },
                  meta: 'meta data'
                }
              }
            ]);
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

      it('should render without NaN values and points', async () => {
        await createChart();

        expect(document.querySelector('.ct-line')).toHaveAttribute(
          'd',
          'M50,15'
        );
        expect(document.querySelector('.ct-point')).toHaveAttribute('x1', '50');
        expect(document.querySelector('.ct-point')).toHaveAttribute(
          'x2',
          '50.01'
        );
      });
    });

    describe('Empty data tests', () => {
      it('should render empty grid with no data', async () => {
        await createChart();
        // Find at least one vertical grid line
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
      });

      it('should render empty grid with only labels', async () => {
        data = {
          labels: [1, 2, 3, 4],
          series: []
        };
        await createChart();

        // Find at least one vertical grid line
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
        // Find exactly as many horizontal grid lines as labels were specified (Step Axis)
        expect(
          document.querySelectorAll('.ct-grids .ct-grid.ct-horizontal').length
        ).toBe(data.labels?.length);
      });

      it('should generate labels and render empty grid with only series in data', async () => {
        data = {
          series: [
            [1, 2, 3, 4],
            [2, 3, 4],
            [3, 4]
          ]
        };
        await createChart();

        // Find at least one vertical grid line
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
        // Should generate the labels using the largest series count
        expect(
          document.querySelectorAll('.ct-grids .ct-grid.ct-horizontal').length
        ).toBe(
          Math.max(
            ...data.series.map(series =>
              Array.isArray(series) ? series.length : 0
            )
          )
        );
      });

      it('should render empty grid with no data and specified high low', async () => {
        data = { series: [] };
        options = {
          width: 400,
          height: 300,
          high: 100,
          low: -100
        };
        await createChart();

        // Find first and last label
        const labels = document.querySelectorAll(
          '.ct-labels .ct-label.ct-vertical'
        );
        const firstLabel = labels[0];
        const lastLabel = labels[labels.length - 1];

        expect(firstLabel.textContent?.trim()).toBe('-100');
        expect(lastLabel.textContent?.trim()).toBe('100');
      });

      it('should render empty grid with no data and reverseData option', async () => {
        data = { series: [] };
        options = {
          reverseData: true
        };
        await createChart();

        // Find at least one vertical grid line
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
      });
    });

    describe('x1 and x2 attribute', () => {
      it('should contain just a datapoint', async () => {
        data = {
          series: [[{ x: 1, y: 2 }]]
        };
        options = {
          fullWidth: true
        };
        await createChart();

        expect(
          document.querySelector('.ct-point')?.getAttribute('x1')
        ).not.toBe('NaN');
        expect(
          document.querySelector('.ct-point')?.getAttribute('x2')
        ).not.toBe('NaN');
      });
    });
  });
});
