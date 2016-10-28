import {initializeFixtures, destroyFixtures, addFixture} from '../testing/fixtures';
import {namespaces} from '../core/globals';
import {deserialize} from '../core/data';
import {PieChart} from './pie';

describe('PieChart', () => {
  beforeEach(() => initializeFixtures());
  afterEach(() => destroyFixtures());

  describe('Meta data tests', () => {

    it('should render meta data correctly on slice with mixed value array', (done) => {
      const fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
      const meta = {
        test: 'Serialized Test'
      };

      const data = {
        labels: ['A', 'B', 'C'],
        series: [5, {
          value: 8,
          meta: meta
        }, 1]
      };

      const chartContainer = fixture.wrapper.querySelector('.ct-chart');
      const chart = new PieChart(chartContainer, data);

      chart.on('created', () => {
        const metaAttribute = chartContainer
          .querySelectorAll('.ct-slice-pie')[1]
          .getAttributeNS(namespaces.ct, 'meta');
        expect(deserialize(metaAttribute)).toEqual(meta);
        chart.off('created');
        done();
      });
    });
  });

  describe('Simple Pie Chart', () => {
    const num = '\\d+(\\.\\d*)?';
    const sum = (a, b) => a + b;
    let data;
    let options;
    let fixture;

    beforeEach(() => {
      data = {
        series: [5, 3, 4]
      };
      options = {
        width: 100,
        height: 100,
        chartPadding: 10,
        labelInterpolationFnc: (value) => `${Math.round(value / data.series.reduce(sum) * 100)}%`
      };
    });

    function createChart(callback) {
      fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
      const chart = new PieChart(fixture.wrapper.querySelector('.ct-chart'), data, options)
        .on('created', () => {
          callback();
          chart.off('created');
        });
    }

    it('should render three slices', (done) => {
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('.ct-slice-pie').length).toBe(3);
        done();
      });
    });

    it('should set value attribute', (done) => {
      createChart(() => {
        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');
        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('5');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('3');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('4');
        done();
      });
    });

    it('should create slice path', (done) => {
      createChart(() => {
        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-pie')).forEach((element) => {
          const pattern = `M${num},${num}A40,40,0,0,0,${num},${num}L50,50Z$`;
          const path = element.getAttribute('d');
          expect(path).toMatch(pattern);
        });
        done();
      });
    });

    it('should add labels', (done) => {
      createChart(() => {
        const labels = fixture.wrapper.querySelectorAll('.ct-label');
        expect(labels[0].textContent).toBe('42%');
        expect(labels[1].textContent).toBe('25%');
        expect(labels[2].textContent).toBe('33%');
        done();
      });
    });

    it('should overlap slices', (done) => {
      data = {
        series: [1, 1]
      };
      createChart(() => {
        const [slice1, slice2] = Array.from(fixture.wrapper.querySelectorAll('.ct-slice-pie'));

        expect(slice1.getAttribute('d')).toMatch(/^M50,90A40,40,0,0,0,50,10L50,50Z/);
        expect(slice2.getAttribute('d')).toMatch(/^M50,10A40,40,0,0,0,50.\d+,90L50,50Z/);
        done();
      });
    });

    it('should set large arc sweep flag', (done) => {
      data = {
        series: [1, 2]
      };
      createChart(() => {
        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[1];
        expect(slice.getAttribute('d')).toMatch(/^M50,10A40,40,0,1,0/);
        done();
      }, data);
    });

    it('should draw complete circle with gap', (done) => {
      data = {
        series: [1]
      };
      createChart(() => {
        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[0];
        expect(slice.getAttribute('d')).toMatch(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/);
        done();
      });
    });

    it('should draw complete circle with startAngle', (done) => {
      data.series = [100];
      options.startAngle = 90;
      createChart(() => {
        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[0];
        expect(slice.getAttribute('d')).toMatch(/^M90,49.9\d+A40,40,0,1,0,90,50L50,50Z/);
        done();
      });
    });

    it('should draw complete circle if values are 0', (done) => {
      data = {
        series: [0, 1, 0]
      };
      createChart(() => {
        const slice = fixture.wrapper.querySelectorAll('.ct-slice-pie')[1];
        expect(slice.getAttribute('d')).toMatch(/^M49.9\d+,10A40,40,0,1,0,50,10L50,50Z/);
        done();
      });
    });

  });

  describe('Pie with small slices', () => {
    let data;
    let options;
    let fixture;

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

    function createChart(callback) {
      fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
      const chart = new PieChart(fixture.wrapper.querySelector('.ct-chart'), data, options)
        .on('created', () => {
          callback();
          chart.off('created');
        });
    }

    it('should render correctly with very small slices', (done) => {
      createChart(() => {
        const [slice1, slice2] = Array.from(fixture.wrapper.querySelectorAll('.ct-slice-pie'));

        expect(slice1.getAttribute('d')).toMatch(/^M50.1\d+,0A50,50,0,0,0,50,0/);
        expect(slice2.getAttribute('d')).toMatch(/^M49.9\d*,0A50,50,0,1,0,50,0/);
        done();
      });
    });

    it('should render correctly with very small slices on startAngle', (done) => {
      options.startAngle = 90;
      createChart(() => {
        const [slice1, slice2] = Array.from(fixture.wrapper.querySelectorAll('.ct-slice-pie'));

        expect(slice1.getAttribute('d')).toMatch(/^M100,50.1\d*A50,50,0,0,0,100,50/);
        expect(slice2.getAttribute('d')).toMatch(/^M100,49.97\d*A50,50,0,1,0,100,49.98\d*/);
        done();
      });
    });

    it('should render correctly with very small slices', (done) => {
      options.donut = true;
      createChart(() => {
        const [slice1, slice2] = Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut'));

        expect(slice1.getAttribute('d')).toMatch(/^M50.\d+,30A20,20,0,0,0,50,30/);
        expect(slice2.getAttribute('d')).toMatch(/^M49.9\d*,30A20,20,0,1,0,50,30/);
        done();
      });
    });
  });

  describe('Pie with empty values', () => {
    let data;
    let options;
    let fixture;

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

    function createChart(callback) {
      fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
      const chart = new PieChart(fixture.wrapper.querySelector('.ct-chart'), data, options)
        .on('created', () => {
          callback();
          chart.off('created');
        });
    }

    it('should not render empty slices', (done) => {
      createChart(() => {
        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(3);
        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('1');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('2');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('4');
        done();
      });
    });

    it('should render without NaN values and points', (done) => {
      data = {
        series: [0, 0, 0]
      };
      options = {
        width: 400,
        height: 400
      };

      createChart(() => {
        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(3);

        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('0');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('0');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('0');

        expect(slices[0].getAttribute('d')).toBe('M200,5A195,195,0,0,0,200,5L200,200Z');
        expect(slices[1].getAttribute('d')).toBe('M200,5A195,195,0,0,0,200,5L200,200Z');
        expect(slices[2].getAttribute('d')).toBe('M200,5A195,195,0,0,0,200,5L200,200Z');
        done();
      });
    });

    it('should render empty slices', (done) => {
      data = {
        series: [1, 2, 0, 4]
      };
      options = {
        width: 100,
        height: 100,
        ignoreEmptyValues: false
      };

      createChart(() => {
        const slices = fixture.wrapper.querySelectorAll('.ct-slice-pie');

        expect(slices.length).toBe(4);

        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('1');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('2');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('0');
        expect(slices[3].getAttributeNS(namespaces.ct, 'value')).toBe('4');
        done();
      });
    });
  });

  describe('Gauge Chart', () => {
    let fixture;
    let data;
    let options;

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
      }
    });

    function createChart(callback) {
      fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
      const chart = new PieChart(fixture.wrapper.querySelector('.ct-chart'), data, options)
        .on('created', () => {
          callback();
          chart.off('created');
        });
    }

    it('should render four strokes', (done) => {
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('.ct-slice-donut').length).toBe(4);
        done();
      });
    });

    it('should set value attribute', (done) => {
      createChart(() => {
        const slices = fixture.wrapper.querySelectorAll('.ct-slice-donut');
        expect(slices[0].getAttributeNS(namespaces.ct, 'value')).toBe('20');
        expect(slices[1].getAttributeNS(namespaces.ct, 'value')).toBe('10');
        expect(slices[2].getAttributeNS(namespaces.ct, 'value')).toBe('30');
        expect(slices[3].getAttributeNS(namespaces.ct, 'value')).toBe('40');
        done();
      });
    });

    it('should create slice path', (done) => {
      const num = '\\d+(\\.\\d*)?';
      const pattern = `^M${num},${num}A170,170,0,0,0,${num},${num}$`;

      createChart(() => {
        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut'))
          .forEach((element) => expect(element.getAttribute('d')).toMatch(pattern));
        done();
      });
    });

    it('should set stroke-width', (done) => {
      const strokeWidth = 'stroke-width:\\s*60px';

      createChart(() => {
        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut'))
          .forEach((element) => expect(element.getAttribute('style')).toMatch(strokeWidth));
        done();
      });
    });

    it('should not add labels', (done) => {
      createChart(() => {
        const labels = fixture.wrapper.querySelectorAll('.ct-label');
        expect(labels.length).toBe(0);
        done();
      });
    });
  });

  describe('Pie Chart with relative donutWidth', () => {
    let fixture;
    let data;
    let options;

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

    function createChart(callback) {
      fixture = addFixture('<div class="ct-chart ct-golden-section"></div>');
      const chart = new PieChart(fixture.wrapper.querySelector('.ct-chart'), data, options)
        .on('created', () => {
          callback();
          chart.off('created');
        });
    }

    it('should render four strokes', (done) => {
      createChart(() => {
        expect(fixture.wrapper.querySelectorAll('.ct-slice-donut').length).toBe(4);
        done();
      });
    });

    it('should create slice path', (done) => {
      const num = '\\d+(\\.\\d*)?';
      const pattern = `^M${num},${num}A175,175,0,0,0,${num},${num}$`;

      createChart(() => {
        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut'))
          .forEach((element) => expect(element.getAttribute('d')).toMatch(pattern));
        done();
      });
    });

    it('should set stroke-width', (done) => {
      const strokeWidth = 'stroke-width:\\s?50px';

      createChart(() => {
        Array.from(fixture.wrapper.querySelectorAll('.ct-slice-donut'))
          .forEach((element) => expect(element.getAttribute('style')).toMatch(strokeWidth));
        done();
      });
    });
  });
});
