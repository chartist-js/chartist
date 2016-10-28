function createCustomMatchers(matchers) {
  return Object.keys(matchers).reduce((customMatchers, matcherName) => {
    customMatchers[matcherName] = (util, customEqualityTesters) => {
      return {
        compare: (actual, expected) => {
          return matchers[matcherName](actual, expected, util, customEqualityTesters);
        }
      };
    };
    return customMatchers;
  }, {});
}

const domMatchers = {
  toHaveClass(actual, expected) {
    const pass = actual.classList.contains(expected);
    return {
      pass,
      message: `Expected ${actual.classList} to contain ${expected}`
    };
  },

  toContainElement(actual, expected) {
    const pass = !!actual.querySelector(expected);
    return {
      pass,
      message: `Expected ${actual} to contain element with selector ${expected}`
    };
  }
};

beforeEach(() => jasmine.addMatchers(createCustomMatchers(domMatchers)));
