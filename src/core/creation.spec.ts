import { addMockWrapper, mockDom, destroyMockDom } from '../../test/mock/dom';
import {
  createSvg,
  createGrid,
  createGridBackground,
  normalizePadding
} from './creation';
import { EventEmitter } from '../event';
import { Svg } from '../svg';

describe('Core', () => {
  describe('Creation', () => {
    beforeEach(() => mockDom());
    afterEach(() => destroyMockDom());

    describe('createSvg', () => {
      it('should not remove non-chartist svg elements', () => {
        const fixture = addMockWrapper(`
          <div id="chart-container">
            <svg id="foo"></svg>
            <div>
              <svg id="bar"></svg>
            </div>
          </div>
        `);

        const container: any =
          fixture.wrapper.querySelector('#chart-container');
        const svg = createSvg(container, '500px', '400px', 'ct-fish-bar');

        expect(svg).toBeDefined();
        expect(svg.classes()).toContain('ct-fish-bar');
        expect(container).toContainElement(document.querySelector('#foo'));
        expect(container).toContainElement(document.querySelector('#bar'));
      });

      it('should remove previous chartist svg elements', () => {
        const fixture = addMockWrapper('<div id="chart-container"></div>');

        const container: any =
          fixture.wrapper.querySelector('#chart-container');
        const svg1 = createSvg(container, '500px', '400px', 'ct-fish-bar');
        const svg2 = createSvg(container, '800px', '200px', 'ct-snake-bar');

        expect(svg1).toBeDefined();
        expect(svg1.classes()).toContain('ct-fish-bar');
        expect(svg2).toBeDefined();
        expect(svg2.classes()).toContain('ct-snake-bar');
        expect(container).not.toContainElement(
          document.querySelector('.ct-fish-bar')
        );
        expect(container).toContainElement(
          document.querySelector('.ct-snake-bar')
        );
      });
    });

    describe('createGrid', () => {
      let group: any;
      let axis: any;
      let classes: any;
      let eventEmitter: EventEmitter;
      let position: any;
      let length: any;
      let offset: any;

      beforeEach(() => {
        eventEmitter = new EventEmitter();
        group = new Svg('g');
        axis = {
          units: {
            pos: 'x'
          },
          counterUnits: {
            pos: 'y'
          }
        };
        classes = [];
        position = 10;
        length = 100;
        offset = 20;
      });

      function onCreated(fn: any, done: any) {
        eventEmitter.on('draw', grid => {
          fn(grid);
          done();
        });
        createGrid(
          position,
          1,
          axis,
          offset,
          length,
          group,
          classes,
          eventEmitter
        );
      }

      it('should add single grid line to group', done => {
        onCreated(
          () =>
            expect(group.querySelectorAll('line').svgElements.length).toBe(1),
          done
        );
      });

      it('should draw line', done => {
        onCreated(() => {
          const line = group.querySelector('line');
          expect(line.attr('x1')).toBe('10');
          expect(line.attr('x2')).toBe('10');
          expect(line.attr('y1')).toBe('20');
          expect(line.attr('y2')).toBe('120');
        }, done);
      });

      it('should draw horizontal line', done => {
        axis.units.pos = 'y';
        axis.counterUnits.pos = 'x';
        onCreated(() => {
          const line = group.querySelector('line');
          expect(line.attr('y1')).toBe('10');
          expect(line.attr('y2')).toBe('10');
          expect(line.attr('x1')).toBe('20');
          expect(line.attr('x2')).toBe('120');
        }, done);
      });
    });

    describe('createGridBackground', () => {
      let group: any;
      let chartRect: any;
      let className: any;
      let eventEmitter: any;

      beforeEach(() => {
        eventEmitter = new EventEmitter();
        group = new Svg('g');
        className = 'ct-test';
        chartRect = {
          x1: 5,
          y2: 10,
          _width: 100,
          _height: 50,
          width() {
            return this._width;
          },
          height() {
            return this._height;
          }
        };
      });

      function onCreated(fn: any, done: any) {
        eventEmitter.on('draw', (data: any) => {
          fn(data);
          done();
        });
        createGridBackground(group, chartRect, className, eventEmitter);
      }

      it('should add rect', done => {
        onCreated(() => {
          const rects = group.querySelectorAll('rect').svgElements;
          expect(rects.length).toBe(1);
          const rect = rects[0];
          expect(rect.attr('x')).toBe('5');
          expect(rect.attr('y')).toBe('10');
          expect(rect.attr('width')).toBe('100');
          expect(rect.attr('height')).toBe('50');
          expect(rect.classes()).toEqual(['ct-test']);
        }, done);
      });

      it('should pass grid to event', done => {
        onCreated((data: any) => {
          expect(data.type).toBe('gridBackground');
          const rect = data.element;
          expect(rect.attr('x')).toBe('5');
          expect(rect.attr('y')).toBe('10');
        }, done);
      });
    });

    describe('padding normalization', () => {
      it('should normalize number padding', () => {
        expect(normalizePadding(10)).toEqual({
          top: 10,
          right: 10,
          bottom: 10,
          left: 10
        });
      });

      it('should normalize number padding when 0 is passed', () => {
        expect(normalizePadding(0)).toEqual({
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        });
      });

      it('should normalize empty padding object with default fallback', () => {
        expect(normalizePadding({})).toEqual({
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        });
      });
    });
  });
});
