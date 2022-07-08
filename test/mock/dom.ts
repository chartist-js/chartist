export type Fixture = ReturnType<typeof addMockWrapper>;

export let container: HTMLDivElement | null = null;

const getBoundingClientRect = SVGElement.prototype.getBoundingClientRect;

export function mockDom() {
  if (!container) {
    container = document.createElement('div');
    container.setAttribute('data-fixture-container', `${+new Date()}`);
    document.body.appendChild(container);
  }
}

export function destroyMockDom() {
  if (container) {
    document.body.removeChild(container);
    container = null;
  }
}

export function addMockWrapper(fixture: string) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML += fixture;
  container?.appendChild(wrapper);
  return {
    wrapper,
    container,
    fixture
  };
}

export function mockDomRects() {
  // @ts-expect-error Mock DOM API.
  SVGElement.prototype.getBoundingClientRect = () => ({
    x: 0,
    y: 0,
    width: 500,
    height: 500,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  });
}

export function destroyMockDomRects() {
  SVGElement.prototype.getBoundingClientRect = getBoundingClientRect;
}
