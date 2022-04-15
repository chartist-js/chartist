export let container = null;

export function initializeFixtures() {
  if(!container) {
    container = document.createElement('div');
    container.setAttribute('data-fixture-container', `${+new Date()}`);
    document.body.appendChild(container);
  }
}

export function destroyFixtures() {
  if(container) {
    document.body.removeChild(container);
    container = null;
  }
}

export function loadFixture(path) {
  if(!container) {
    initializeFixtures();
  }

  return SystemJS.import(path).then((module) => {
    return addFixture(module.default || module);
  });
}

export function addFixture(fixture) {
  const wrapper = document.createElement('div');
  wrapper.innerHTML += fixture;
  container.appendChild(wrapper);
  return {
    wrapper,
    container,
    fixture
  };
}
