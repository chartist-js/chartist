const mock = new Proxy(
  {},
  {
    get() {
      return '';
    }
  }
);

module.exports = mock;
