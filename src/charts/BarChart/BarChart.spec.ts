import { AutoScaleAxis } from '../../axes';
import { BarChartOptions, BarChartData, BarChart } from '.';
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
  describe('BarChart', () => {
    let fixture: Fixture;
    let chart: BarChart;
    let options: BarChartOptions;
    let data: BarChartData;

    function createChart() {
      return new Promise<void>(resolve => {
        fixture = addMockWrapper(
          '<div class="ct-chart ct-golden-section"></div>'
        );
        const { wrapper } = fixture;
        chart = new BarChart(
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
        data = { series: [] };
        options = {};
        await createChart();

        expect(fixture.wrapper.querySelectorAll('g.ct-grids').length).toBe(1);
      });

      it('should draw grid lines', async () => {
        await createChart();

        expect(
          fixture.wrapper.querySelectorAll(
            'g.ct-grids line.ct-grid.ct-horizontal'
          ).length
        ).toBe(3);
        expect(
          fixture.wrapper.querySelectorAll(
            'g.ct-grids line.ct-grid.ct-vertical'
          ).length
        ).toBe(6);
      });

      it('should draw grid background', async () => {
        options.showGridBackground = true;
        await createChart();

        expect(
          fixture.wrapper.querySelectorAll('g.ct-grids rect.ct-grid-background')
            .length
        ).toBe(1);
      });

      it('should not draw grid background if option set to false', async () => {
        options.showGridBackground = false;
        await createChart();

        expect(
          fixture.wrapper.querySelectorAll('g.ct-grids rect.ct-grid-background')
            .length
        ).toBe(0);
      });
    });

    describe('ct:value attribute', () => {
      it('should contain x and y value for each bar', async () => {
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
            type: AutoScaleAxis
          }
        };
        await createChart();

        const bars = fixture.wrapper.querySelectorAll('.ct-bar');
        expect(bars[0].getAttributeNS(namespaces.ct, 'value')).toEqual('1,2');
        expect(bars[1].getAttributeNS(namespaces.ct, 'value')).toEqual('3,4');
      });

      it('should render values that are zero', async () => {
        data = {
          series: [
            [
              { x: 0, y: 1 },
              { x: 2, y: 0 },
              { x: 0, y: 0 }
            ]
          ]
        };
        options = {
          axisX: {
            type: AutoScaleAxis
          }
        };
        await createChart();

        const bars = fixture.wrapper.querySelectorAll('.ct-bar');
        expect(bars[0].getAttributeNS(namespaces.ct, 'value')).toEqual('0,1');
        expect(bars[1].getAttributeNS(namespaces.ct, 'value')).toEqual('2,0');
        expect(bars[2].getAttributeNS(namespaces.ct, 'value')).toEqual('0,0');
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

        const bar = fixture.wrapper.querySelectorAll('.ct-bar')[3];
        expect(deserialize(bar.getAttributeNS(namespaces.ct, 'meta'))).toEqual(
          meta
        );
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

        const bar = fixture.wrapper.querySelectorAll('.ct-bar')[3];
        expect(deserialize(bar.getAttributeNS(namespaces.ct, 'meta'))).toEqual(
          meta
        );
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
              .querySelectorAll('.ct-series-a .ct-bar')[3]
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
              .querySelectorAll('.ct-series-b .ct-bar')[2]
              .getAttributeNS(namespaces.ct, 'meta')
          )
        ).toEqual(valueMeta);
      });
    });

    describe('Empty data tests', () => {
      it('should render empty grid with no data', async () => {
        data = { series: [] };
        options = {};
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
        options = {
          reverseData: true
        };
        await createChart();

        // Find at least one vertical grid line
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
      });

      it('should render empty grid with no data and stackBars option', async () => {
        options = {
          stackBars: true
        };
        await createChart();

        // Find at least one vertical grid line
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
      });

      it('should render empty grid with no data and horizontalBars option', async () => {
        options = {
          horizontalBars: true
        };
        await createChart();

        // Find at least one vertical grid line
        // TODO: In theory the axis should be created with ct-horizontal class
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
      });

      it('should render empty grid with no data and distributeSeries option', async () => {
        options = {
          distributeSeries: true
        };
        await createChart();

        // Find at least one vertical grid line
        expect(
          document.querySelector('.ct-grids .ct-grid.ct-vertical')
        ).toBeDefined();
      });
    });
  });
});
