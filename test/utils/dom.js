import { JSDOM } from "jsdom";

const jsdom = new JSDOM("<!doctype html><html><body></body></html>");
const { window } = jsdom;
const { window: origWindow } = global;

const copyProps = (src, target) => {
  Object.defineProperties(target, {
    ...Object.getOwnPropertyDescriptors(src),
    ...Object.getOwnPropertyDescriptors(target)
  });
};

const prepareDom = () => {
  global.window = window;
  global.document = window.document;
};

const cleanupDom = () => {
  window.global = origWindow;
};

const appendToDom = (innerHTML, containerEl = "div") => {
  const el = document.createElement(containerEl);

  el.innerHTML = innerHTML;
  global.document.body.innerHTML = "";
  global.document.body.appendChild(el);
};

export { appendToDom, cleanupDom, prepareDom };
