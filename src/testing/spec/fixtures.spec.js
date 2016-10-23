import {loadFixture, destroyFixtures, initializeFixtures, container} from '../fixtures';

describe('Fixtures', () => {
  beforeEach(() => initializeFixtures());
  afterEach(() => destroyFixtures());

  it('should initialize correctly and add container to body', () => {
    initializeFixtures();
    expect(document.querySelector('[data-fixture-container]')).toBe(container);
    expect(container.parentNode).toBe(document.body);
  });

  it('should destroy correctly and remove any existing container', () => {
    initializeFixtures();
    destroyFixtures();
    expect(document.querySelector('[data-fixture-container]')).toBeFalsy();
    expect(container).toBeFalsy();
  });

  it('should load fixtures with single element and set wrapper, fixture and container correctly', (done) => {
    loadFixture('chartist/testing/spec/fixture-with-single-element.html!text').then((context) => {
      expect(context.container).toBe(container);
      expect(context.wrapper.textContent.trim()).toBe('This is a test fixture');
      expect(context.fixture.trim()).toBe('<h1>This is a test fixture</h1>');
      done();
    });
  });

  it('should load fixtures with multiple elements', (done) => {
    loadFixture('/src/testing/spec/fixture-with-multiple-elements.html!text').then((context) => {
      expect(context.container.textContent.trim()).toBe('First element-Second element-Third element');
      done();
    });
  });

  it('should load multiple fixtures correctly', (done) => {
    Promise.all([
      loadFixture('/src/testing/spec/fixture-with-single-element.html!text'),
      loadFixture('/src/testing/spec/fixture-with-multiple-elements.html!text')
    ]).then(() => {
      expect(container.childNodes.length).toBe(2);
      expect(container.childNodes[0].textContent.trim()).toBe('This is a test fixture');
      expect(container.childNodes[1].textContent.trim()).toBe('First element-Second element-Third element');
      done();
    });
  });
});
