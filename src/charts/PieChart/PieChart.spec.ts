import { namespaces, deserialize } from '../../core';
import { PieChartOptions, PieChartData, PieChart } from '.';
import {
  Fixture,
  addMockWrapper,
  destroyMockDom,
  mockDom
} from '../../../test/mock/dom';

describe('Charts', () => {
  describe('PieChart', () => {
    let fixture: Fixture;
    let chart: PieChart;
    let options: PieChartOptions;
    let data: PieChartData;

    function createChart() {
      return new Promise<void>(resolve => {
        fixture = addMockWrapper(
          '<div class="ct-chart ct-golden-section"></div>'
        );
        const { wrapper } = fixture;
        chart = new PieChart(
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
    });
    afterEach(() => {
      destroyMockDom();
      data = { series: [] };
      options = {};
    });

    describe('Meta data tests', () => {
      it('should render meta data correctly on slice with mixed value array', async () => {
        const fixture = addMockWrapper(
          '<div class="ct-chart ct-golden-section"></div>'
        );
        const meta = {
          test: 'Serialized Test'
        };

        const data = {
          labels: ['A', 'B', 'C'],
          series: [
            5,
            {
              value: 8,
              meta: meta
            },
            1
          ]
        };

        const chartContainer = fixture.wrapper.querySelector('.ct-chart');
        const chart = new PieChart(chartContainer, data);

        chart.on('created', () => {
          const metaAttribute = chartContainer
            ?.querySelectorAll('.ct-slice-pie')[1]
            .getAttributeNS(namespaces.ct, 'meta');
          expect(deserialize(metaAttribute)).toEqual(meta);
          chart.off('created');
        });
      });
    });

    describe('Simple Pie Chart', () => {
      const num = '\\d+(\\.\\d*)?';
      const sum = (a: number, b: number) => a + b;

      beforeEach(() => {
        const series = [5, 3, 4];

        data = {
          series
        };
        options = {
          width: 100,
          height: 100,
          chartPadding: 10,
          labelInterpolationFnc: value =>
            `${Math.round((Number(value) / series.reduce(sum)) * 100)}%`
        };
      });

      it('should render three slices', async () => {
        await createChart();

        expect(fixture.wrapper.querySelectorAll('.ct-slice-pie').length).toBe(
          3
        );
      });

      it('should set value attribute', async () => {
        await createChart();

        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');
        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('5');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('3');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('4');
      });

      it('should create slice path', async () => {
        await createChart();

        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-pie')).forEach(
          element => {
            const pattern = new RegExp(
              `M${num},${num}A40,40,0,0,0,${num},${num}L50,50Z$`
            );
            const path = element.getAttribute('d');
            expect(path).toMatch(pattern);
          }
        );
      });

      it('should add labels', async () => {
        await createChart();

        const labels = fixture.wrapper.querySelectorAll('.ct-label');
        expect(labels[0]).toHaveTextContent('42%');
        expect(labels[1]).toHaveTextContent('25%');
        expect(labels[2]).toHaveTextContent('33%');
      });

      it('should overlap slices', async () => {
        data = {
          series: [1, 1]
        };
        await createChart();

        const [slice1, slice2] = Array.from(
          fixture.wrapper.querySelectorAll('.ct-slice-pie')
        );

        expect(slice1).toHaveAttribute(
          'd',
          expect.stringMatching(/^M50,90A40,40,0,0,0,50,10L50,50Z/)
        );
        expect(slice2).toHaveAttribute(
          'd',
          expect.stringMatching(/^M50,10A40,40,0,0,0,50.\d+,90L50,50Z/)
        );
      });

      it('should set large arc sweep flag', async () => {
        data = {
          series: [1, 2]
        };
        await createChart();

        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[1];
        expect(slice).toHaveAttribute(
          'd',
          expect.stringMatching(/^M50,10A40,40,0,1,0/)
        );
      });

      it('should draw complete circle with gap', async () => {
        data = {
          series: [1]
        };
        await createChart();

        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[0];
        expect(slice).toHaveAttribute(
          'd',
          expect.stringMatching(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/)
        );
      });

      it('should draw complete circle with startAngle', async () => {
        data.series = [100];
        options.startAngle = 90;
        await createChart();

        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[0];
        expect(slice).toHaveAttribute(
          'd',
          expect.stringMatching(/^M90,49.9\d+A40,40,0,1,0,90,50L50,50Z/)
        );
      });

      it('should draw complete circle if values are 0', async () => {
        data = {
          series: [0, 1, 0]
        };
        await createChart();

        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[1];
        expect(slice).toHaveAttribute(
          'd',
          expect.stringMatching(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/)
        );
      });
    });

    describe('Pie with small slices', () => {
      beforeEach(() => {
        data = {
          series: [0.001, 2]
        };
        options = {
          width: 100,
          height: 100,
          chartPadding: 0
        };
      });

      it('should render correctly with very small slices', async () => {
        await createChart();

        const [slice1, slice2] = Array.from(
          fixture.wrapper.querySelectorAll('.ct-slice-pie')
        );

        expect(slice1).toHaveAttribute(
          'd',
          expect.stringMatching(/^M50.1\d+,0A50,50,0,0,0,50,0/)
        );
        expect(slice2).toHaveAttribute(
          'd',
          expect.stringMatching(/^M49.9\d*,0A50,50,0,1,0,50,0/)
        );
      });

      it('should render correctly with very small slices on startAngle', async () => {
        options.startAngle = 90;
        await createChart();

        const [slice1, slice2] = Array.from(
          fixture.wrapper.querySelectorAll('.ct-slice-pie')
        );

        expect(slice1).toHaveAttribute(
          'd',
          expect.stringMatching(/^M100,50.1\d*A50,50,0,0,0,100,50/)
        );
        expect(slice2).toHaveAttribute(
          'd',
          expect.stringMatching(/^M100,49.97\d*A50,50,0,1,0,100,49.98\d*/)
        );
      });

      it('should render correctly with very small slices', async () => {
        options.donut = true;
        await createChart();

        const [slice1, slice2] = Array.from(
          fixture.wrapper.querySelectorAll('.ct-slice-donut')
        );

        expect(slice1).toHaveAttribute(
          'd',
          expect.stringMatching(/^M50.\d+,30A20,20,0,0,0,50,30/)
        );
        expect(slice2).toHaveAttribute(
          'd',
          expect.stringMatching(/^M49.9\d*,30A20,20,0,1,0,50,30/)
        );
      });
    });

    describe('Pie with empty values', () => {
      beforeEach(() => {
        data = {
          series: [1, 2, 0, 4]
        };
        options = {
          width: 100,
          height: 100,
          ignoreEmptyValues: true
        };
      });

      it('should not render empty slices', async () => {
        await createChart();

        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(3);
        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('1');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('2');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('4');
      });

      it('should render without NaN values and points', async () => {
        data = {
          series: [0, 0, 0]
        };
        options = {
          width: 400,
          height: 400
        };
        await createChart();

        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(3);

        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('0');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('0');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('0');

        expect(slices[0]).toHaveAttribute(
          'd',
          'M200,5A195,195,0,0,0,200,5L200,200Z'
        );
        expect(slices[1]).toHaveAttribute(
          'd',
          'M200,5A195,195,0,0,0,200,5L200,200Z'
        );
        expect(slices[2]).toHaveAttribute(
          'd',
          'M200,5A195,195,0,0,0,200,5L200,200Z'
        );
      });

      it('should render empty slices', async () => {
        data = {
          series: [1, 2, 0, 4]
        };
        options = {
          width: 100,
          height: 100,
          ignoreEmptyValues: false
        };
        await createChart();

        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(4);

        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('1');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('2');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('0');
        expect(slices[3].getAttributeNS(namespaces.ct, 'value')).toBe('4');
      });
    });

    describe('Gauge Chart', () => {
      beforeEach(() => {
        data = {
          series: [20, 10, 30, 40]
        };
        options = {
          chartPadding: 50,
          height: 500,
          width: 500,
          donut: true,
          donutWidth: 60,
          startAngle: 270,
          total: 200,
          showLabel: false
        };
      });

      it('should render four strokes', async () => {
        await createChart();

        expect(fixture.wrapper.querySelectorAll('.ct-slice-donut').length).toBe(
          4
        );
      });

      it('should set value attribute', async () => {
        await createChart();

        const slices = fixture.wrapper.querySelectorAll('.ct-slice-donut');
        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('20');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('10');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('30');
        expect(slices[3].getAttributeNS(namespaces.ct, 'value')).toBe('40');
      });

      it('should create slice path', async () => {
        const num = '\\d+(\\.\\d*)?';
        const pattern = new RegExp(
          `^M${num},${num}A170,170,0,0,0,${num},${num}$`
        );
        await createChart();

        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut')).forEach(
          element =>
            expect(element).toHaveAttribute('d', expect.stringMatching(pattern))
        );
      });

      it('should set stroke-width', async () => {
        const strokeWidth = new RegExp('stroke-width:\\s*60px');
        await createChart();

        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut')).forEach(
          element =>
            expect(element).toHaveAttribute(
              // eslint-disable-next-line jest-dom/prefer-to-have-style
              'style',
              expect.stringMatching(strokeWidth)
            )
        );
      });

      it('should not add labels', async () => {
        await createChart();

        const labels = fixture.wrapper.querySelectorAll('.ct-label');
        expect(labels.length).toBe(0);
      });
    });

    describe('Pie Chart with relative donutWidth', () => {
      beforeEach(() => {
        data = {
          series: [20, 10, 30, 40]
        };
        options = {
          chartPadding: 50,
          height: 500,
          width: 500,
          donut: true,
          donutWidth: '25%',
          showLabel: false
        };
      });

      it('should render four strokes', async () => {
        await createChart();

        expect(fixture.wrapper.querySelectorAll('.ct-slice-donut').length).toBe(
          4
        );
      });

      it('should create slice path', async () => {
        const num = '\\d+(\\.\\d*)?';
        const pattern = new RegExp(
          `^M${num},${num}A175,175,0,0,0,${num},${num}$`
        );
        await createChart();

        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut')).forEach(
          element =>
            expect(element).toHaveAttribute('d', expect.stringMatching(pattern))
        );
      });

      it('should set stroke-width', async () => {
        const strokeWidth = new RegExp('stroke-width:\\s?50px');
        await createChart();

        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut')).forEach(
          element =>
            expect(element).toHaveAttribute(
              // eslint-disable-next-line jest-dom/prefer-to-have-style
              'style',
              expect.stringMatching(strokeWidth)
            )
        );
      });
    });
  });
});
